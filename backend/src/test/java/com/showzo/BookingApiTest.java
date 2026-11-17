package com.showzo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.showzo.catalogue.ShowTimeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * No Razorpay keys are set in tests, so the demo gateway is active.
 * Real Razorpay signature checking is covered by RazorpayGatewayTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingApiTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ShowTimeRepository showTimeRepository;

    /** Shows 20 onwards, so these tests never share a show with SeatHoldApiTest. */
    private Long futureShowId(int n) {
        LocalDateTime cutoff = LocalDateTime.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
        return showTimeRepository.findAll().stream()
                .filter(show -> show.getStartTime().isAfter(cutoff))
                .skip(20L + n)
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private String tokenFor(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", name, "email", name.toLowerCase() + "@pay.example.com", "password", "correct-horse-9"));
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private void hold(Long showId, String token, String... seats) throws Exception {
        mockMvc.perform(post("/api/shows/{id}/holds", showId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("seats", List.of(seats)))))
                .andExpect(status().isCreated());
    }

    private JsonNode checkout(Long showId, String token) throws Exception {
        String response = mockMvc.perform(post("/api/shows/{id}/checkout", showId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private ResultActions confirm(long bookingId, String token, String orderId, String paymentId) throws Exception {
        return mockMvc.perform(post("/api/bookings/{id}/confirm", bookingId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("orderId", orderId, "paymentId", paymentId))));
    }

    private static String statusOf(String label) {
        return "$.rows[?(@.row=='" + label.charAt(0) + "')].seats[?(@.label=='" + label + "')].status";
    }

    @Test
    void holdPayAndGetATicket() throws Exception {
        Long showId = futureShowId(0);
        String asha = tokenFor("Asha");
        String ravi = tokenFor("Ravi");

        hold(showId, asha, "H2", "H1");
        JsonNode order = checkout(showId, asha);

        assertEquals("DEMO", order.get("gateway").asText());
        assertEquals(List.of("H1", "H2"), List.of(order.get("seats").get(0).asText(), order.get("seats").get(1).asText()));
        // Total = tickets + Rs 30 per seat, and the gateway amount is the same figure in paise.
        double tickets = order.get("ticketAmount").asDouble();
        assertEquals(60.0, order.get("convenienceFee").asDouble());
        assertEquals(tickets + 60.0, order.get("totalAmount").asDouble());
        assertEquals(Math.round((tickets + 60.0) * 100), order.get("amountInPaise").asLong());

        long bookingId = order.get("bookingId").asLong();
        String orderId = order.get("orderId").asText();

        confirm(bookingId, asha, orderId, "demo_pay_1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.bookingRef").value(order.get("bookingRef").asText()))
                .andExpect(jsonPath("$.seats", hasSize(2)))
                .andExpect(jsonPath("$.movieTitle").isNotEmpty());

        // Sending the same confirmation again is harmless.
        confirm(bookingId, asha, orderId, "demo_pay_1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("H1")).value("BOOKED"))
                .andExpect(jsonPath(statusOf("H2")).value("BOOKED"));

        mockMvc.perform(get("/api/bookings").header("Authorization", "Bearer " + asha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(bookingId));

        // Nobody else can read the ticket or take the seats.
        mockMvc.perform(get("/api/bookings/{id}", bookingId).header("Authorization", "Bearer " + ravi))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/bookings").header("Authorization", "Bearer " + ravi))
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/shows/{id}/holds", showId)
                        .header("Authorization", "Bearer " + ravi)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"seats\":[\"H1\"]}"))
                .andExpect(status().isConflict());
    }

    @Test
    void cannotCheckOutWithoutHeldSeats() throws Exception {
        String meera = tokenFor("Meera");
        mockMvc.perform(post("/api/shows/{id}/checkout", futureShowId(1))
                        .header("Authorization", "Bearer " + meera))
                .andExpect(status().isBadRequest());
    }

    @Test
    void madeUpPaymentDetailsDoNotBookSeats() throws Exception {
        Long showId = futureShowId(2);
        String kabir = tokenFor("Kabir");

        hold(showId, kabir, "B1");
        JsonNode order = checkout(showId, kabir);
        long bookingId = order.get("bookingId").asLong();

        confirm(bookingId, kabir, "demo_order_someoneelses", "demo_pay_1").andExpect(status().isBadRequest());
        confirm(bookingId, kabir, order.get("orderId").asText(), "pay_invented").andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("B1")).value("HELD"));
        mockMvc.perform(get("/api/bookings").header("Authorization", "Bearer " + kabir))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void paymentAfterTheSeatsWereGivenUpDoesNotBookThem() throws Exception {
        Long showId = futureShowId(3);
        String zoya = tokenFor("Zoya");

        hold(showId, zoya, "C1");
        JsonNode order = checkout(showId, zoya);
        mockMvc.perform(delete("/api/shows/{id}/holds", showId).header("Authorization", "Bearer " + zoya))
                .andExpect(status().isNoContent());

        confirm(order.get("bookingId").asLong(), zoya, order.get("orderId").asText(), "demo_pay_2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));

        mockMvc.perform(get("/api/shows/{id}/seats", showId))
                .andExpect(jsonPath(statusOf("C1")).value("AVAILABLE"));
    }

    @Test
    void checkoutAndBookingsNeedLogin() throws Exception {
        mockMvc.perform(post("/api/shows/{id}/checkout", futureShowId(4)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isUnauthorized());
    }
}
