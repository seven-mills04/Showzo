package com.showzo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.showzo.booking.SeatReservation;
import com.showzo.booking.SeatReservationRepository;
import com.showzo.booking.SeatService;
import com.showzo.catalogue.ShowTimeRepository;
import com.showzo.common.ConflictException;
import com.showzo.user.Role;
import com.showzo.user.User;
import com.showzo.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Each test uses its own show, so the tests cannot affect each other. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SeatHoldApiTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ShowTimeRepository showTimeRepository;
    @Autowired
    private SeatReservationRepository reservationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SeatService seatService;

    /** The n-th show that starts more than a day from now. */
    private Long futureShowId(int n) {
        LocalDateTime cutoff = LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
        return showTimeRepository.findAll().stream()
                .filter(show -> show.getStartTime().isAfter(cutoff))
                .skip(n)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private String tokenFor(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", name, "email", name.toLowerCase() + "@seats.example.com", "password", "correct-horse-9"));
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private ResultActions hold(Long showId, String token, String... seats) throws Exception {
        return mockMvc.perform(post("/api/shows/{id}/holds", showId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("seats", List.of(seats)))));
    }

    /** JsonPath for the status of one seat, e.g. seat "B3". */
    private static String statusOf(String label) {
        return "$.rows[?(@.row=='" + label.charAt(0) + "')].seats[?(@.label=='" + label + "')].status";
    }

    @Test
    void seatMapIsPublicAndStartsEmpty() throws Exception {
        mockMvc.perform(get("/api/shows/{id}/seats", futureShowId(0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieTitle").isNotEmpty())
                .andExpect(jsonPath("$.rows[0].row").value("A"))
                .andExpect(jsonPath("$.rows[0].tier").value("CLASSIC"))
                .andExpect(jsonPath("$.rows[0].seats[0].label").value("A1"))
                .andExpect(jsonPath("$.rows[0].seats[0].status").value("AVAILABLE"));

        mockMvc.perform(get("/api/shows/{id}/seats", 9_999_999))
                .andExpect(status().isNotFound());
    }

    @Test
    void heldSeatsShowAsYoursToTheHolderAndHeldToEveryoneElse() throws Exception {
        Long showId = futureShowId(1);
        String asha = tokenFor("Asha");

        hold(showId, asha, "b3", "B4")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seats[0]").value("B3"))
                .andExpect(jsonPath("$.totalAmount").isNumber())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());

        mockMvc.perform(get("/api/shows/{id}/seats", showId).header("Authorization", "Bearer " + asha))
                .andExpect(jsonPath(statusOf("B3")).value("YOURS"))
                .andExpect(jsonPath("$.yourHoldExpiresAt").isNotEmpty());

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("B3")).value("HELD"))
                .andExpect(jsonPath(statusOf("B5")).value("AVAILABLE"));
    }

    @Test
    void secondPersonCannotTakeAHeldSeatAndGetsNoneOfTheirSelection() throws Exception {
        Long showId = futureShowId(2);
        String ravi = tokenFor("Ravi");
        String meera = tokenFor("Meera");

        hold(showId, ravi, "C1", "C2").andExpect(status().isCreated());

        // C2 is taken, so the whole request fails and C3 must stay free.
        hold(showId, meera, "C2", "C3").andExpect(status().isConflict());

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("C2")).value("HELD"))
                .andExpect(jsonPath(statusOf("C3")).value("AVAILABLE"));
    }

    @Test
    void holdingAgainReplacesThePreviousSelection() throws Exception {
        Long showId = futureShowId(3);
        String kabir = tokenFor("Kabir");

        hold(showId, kabir, "D1", "D2").andExpect(status().isCreated());
        hold(showId, kabir, "D2", "D3").andExpect(status().isCreated());

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("D1")).value("AVAILABLE"))
                .andExpect(jsonPath(statusOf("D2")).value("HELD"))
                .andExpect(jsonPath(statusOf("D3")).value("HELD"));
    }

    @Test
    void releasingFreesTheSeats() throws Exception {
        Long showId = futureShowId(4);
        String zoya = tokenFor("Zoya");

        hold(showId, zoya, "E1").andExpect(status().isCreated());
        mockMvc.perform(delete("/api/shows/{id}/holds", showId).header("Authorization", "Bearer " + zoya))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("E1")).value("AVAILABLE"));
    }

    @Test
    void expiredHoldCanBeTakenBySomeoneElse() throws Exception {
        Long showId = futureShowId(5);
        String imran = tokenFor("Imran");
        String neha = tokenFor("Neha");

        hold(showId, imran, "F1").andExpect(status().isCreated());

        // Pretend eight minutes have passed.
        for (SeatReservation reservation : reservationRepository.findActiveForShow(showId, Instant.now())) {
            reservation.setExpiresAt(Instant.now().minusSeconds(5));
            reservationRepository.save(reservation);
        }

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("F1")).value("AVAILABLE"));
        hold(showId, neha, "F1").andExpect(status().isCreated());
    }

    @Test
    void rejectsBadRequests() throws Exception {
        Long showId = futureShowId(6);
        String dev = tokenFor("Dev");

        hold(showId, dev, "Z99").andExpect(status().isBadRequest());
        hold(showId, dev).andExpect(status().isBadRequest());
        hold(showId, dev, "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11")
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/shows/{id}/holds", showId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"seats\":[\"A1\"]}"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * The important one: eight people ask for the same seat at the same instant.
     * Exactly one of them must get it.
     */
    @Test
    void onlyOneOfManySimultaneousRequestsGetsTheSeat() throws Exception {
        Long showId = futureShowId(7);
        int people = 8;

        List<String> emails = new ArrayList<>();
        for (int i = 0; i < people; i++) {
            String email = "racer" + i + "@seats.example.com";
            userRepository.save(new User("Racer " + i, email, "not-a-real-hash", Role.USER));
            emails.add(email);
        }

        ExecutorService pool = Executors.newFixedThreadPool(people);
        CountDownLatch startGun = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        for (String email : emails) {
            Callable<Boolean> attempt = () -> {
                startGun.await();
                try {
                    seatService.holdSeats(email, showId, List.of("G7"));
                    return true;
                } catch (ConflictException lostTheRace) {
                    return false;
                }
            };
            results.add(pool.submit(attempt));
        }
        startGun.countDown();

        int winners = 0;
        for (Future<Boolean> result : results) {
            if (result.get(30, TimeUnit.SECONDS)) {
                winners++;
            }
        }
        pool.shutdown();

        assertEquals(1, winners, "exactly one person should get the seat");
        assertEquals(1, reservationRepository.findActiveForShow(showId, Instant.now()).size());
    }
}
