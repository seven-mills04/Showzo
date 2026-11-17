package com.showzo.seed;

import com.showzo.catalogue.Movie;
import com.showzo.catalogue.MovieRepository;
import com.showzo.catalogue.MovieStatus;
import com.showzo.catalogue.Screen;
import com.showzo.catalogue.ScreenRepository;
import com.showzo.catalogue.ShowTime;
import com.showzo.catalogue.ShowTimeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Keeps the schedule filled for the coming week. A real cinema enters its shows by hand;
 * this demo generates them so the site never runs out of shows to book.
 * Runs at startup and again just after midnight every day.
 */
@Component
public class ShowPlanner {

    private static final Logger log = LoggerFactory.getLogger(ShowPlanner.class);

    private static final List<LocalTime> SLOTS = List.of(
            LocalTime.of(9, 30), LocalTime.of(12, 45), LocalTime.of(16, 0),
            LocalTime.of(19, 15), LocalTime.of(22, 30));

    private final MovieRepository movieRepository;
    private final ScreenRepository screenRepository;
    private final ShowTimeRepository showTimeRepository;
    private final Clock clock;
    private final int daysAhead;

    public ShowPlanner(MovieRepository movieRepository, ScreenRepository screenRepository,
                       ShowTimeRepository showTimeRepository, Clock clock,
                       @Value("${showzo.shows.days-ahead}") int daysAhead) {
        this.movieRepository = movieRepository;
        this.screenRepository = screenRepository;
        this.showTimeRepository = showTimeRepository;
        this.clock = clock;
        this.daysAhead = daysAhead;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void ensureUpcomingShows() {
        List<Movie> movies = movieRepository.findByStatusOrderByReleaseDateAsc(MovieStatus.NOW_SHOWING);
        List<Screen> screens = screenRepository.findAll(Sort.by("id"));
        if (movies.isEmpty() || screens.isEmpty()) {
            return;
        }

        LocalDate today = LocalDate.now(clock);
        List<ShowTime> created = new ArrayList<>();

        for (int dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
            LocalDate day = today.plusDays(dayOffset);
            for (int screenIndex = 0; screenIndex < screens.size(); screenIndex++) {
                Screen screen = screens.get(screenIndex);
                boolean alreadyPlanned = showTimeRepository.existsByScreenIdAndStartTimeBetween(
                        screen.getId(), day.atStartOfDay(), day.atTime(LocalTime.MAX));
                if (alreadyPlanned) {
                    continue;
                }
                for (int slot = 0; slot < SLOTS.size(); slot++) {
                    // Rotating by screen, slot and date spreads every movie across theatres and times.
                    int rotation = (int) ((screenIndex + slot + day.toEpochDay()) % movies.size());
                    Movie movie = movies.get(rotation);
                    List<String> languages = movie.getLanguages().stream().sorted().toList();
                    String language = languages.get((screenIndex + slot) % languages.size());
                    created.add(new ShowTime(movie, screen, day.atTime(SLOTS.get(slot)), language,
                            priceFor(screen, SLOTS.get(slot), day)));
                }
            }
        }

        showTimeRepository.saveAll(created);
        if (!created.isEmpty()) {
            log.info("Planned {} new shows up to {}", created.size(), today.plusDays(daysAhead - 1L));
        }
    }

    /** Base price, plus extra for premium screens, evening shows and weekends. */
    private static BigDecimal priceFor(Screen screen, LocalTime time, LocalDate day) {
        int price = 160;
        switch (screen.getFormat()) {
            case "IMAX" -> price += 200;
            case "3D" -> price += 60;
            default -> { }
        }
        if (!time.isBefore(LocalTime.of(16, 0))) {
            price += 80;
        }
        if (day.getDayOfWeek() == DayOfWeek.SATURDAY || day.getDayOfWeek() == DayOfWeek.SUNDAY) {
            price += 40;
        }
        return BigDecimal.valueOf(price);
    }
}
