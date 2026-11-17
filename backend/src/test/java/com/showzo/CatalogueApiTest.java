package com.showzo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against the seeded demo data in an in-memory database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogueApiTest {

    @Autowired
    private MockMvc mockMvc;

    private static LocalDate tomorrow() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
    }

    @Test
    void listsCitiesInAlphabeticalOrder() throws Exception {
        mockMvc.perform(get("/api/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].slug").value("bengaluru"))
                .andExpect(jsonPath("$[1].slug").value("delhi-ncr"));
    }

    @Test
    void listsMoviesPlayingInCityHighestRatedFirst() throws Exception {
        mockMvc.perform(get("/api/movies").param("city", "delhi-ncr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)))
                .andExpect(jsonPath("$[0].slug").value("kabaddi-kings"));
    }

    @Test
    void filtersMoviesByLanguageGenreAndTitle() throws Exception {
        mockMvc.perform(get("/api/movies").param("city", "delhi-ncr").param("language", "punjabi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].slug").value("kabaddi-kings"));

        mockMvc.perform(get("/api/movies").param("city", "mumbai").param("genre", "Comedy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        mockMvc.perform(get("/api/movies").param("city", "bengaluru").param("q", "orbit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].slug").value("orbit-9"));
    }

    @Test
    void unknownCityIsNotFound() throws Exception {
        mockMvc.perform(get("/api/movies").param("city", "atlantis"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("City not found: atlantis"));
    }

    @Test
    void missingCityParameterIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsMovieDetails() throws Exception {
        mockMvc.perform(get("/api/movies/monsoon-junction"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Monsoon Junction"))
                .andExpect(jsonPath("$.durationMinutes").value(142))
                .andExpect(jsonPath("$.status").value("NOW_SHOWING"));

        mockMvc.perform(get("/api/movies/no-such-movie"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listsComingSoonMovies() throws Exception {
        mockMvc.perform(get("/api/movies/coming-soon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].slug").value("midnight-in-meghalaya"));
    }

    @Test
    void groupsShowsByTheatre() throws Exception {
        mockMvc.perform(get("/api/movies/kabaddi-kings/shows")
                        .param("city", "delhi-ncr")
                        .param("date", tomorrow().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].theatreName").exists())
                .andExpect(jsonPath("$[0].shows", not(empty())))
                .andExpect(jsonPath("$[0].shows[0].basePrice").exists());
    }

    @Test
    void rejectsShowsForPastDate() throws Exception {
        mockMvc.perform(get("/api/movies/kabaddi-kings/shows")
                        .param("city", "delhi-ncr")
                        .param("date", tomorrow().minusDays(5).toString()))
                .andExpect(status().isBadRequest());
    }
}
