package com.showzo.catalogue;

import com.showzo.catalogue.CatalogueDtos.CityDto;
import com.showzo.catalogue.CatalogueDtos.MovieDetail;
import com.showzo.catalogue.CatalogueDtos.MovieSummary;
import com.showzo.catalogue.CatalogueDtos.ShowSlot;
import com.showzo.catalogue.CatalogueDtos.TheatreShows;
import com.showzo.common.BadRequestException;
import com.showzo.common.NotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class CatalogueService {

    private final CityRepository cityRepository;
    private final MovieRepository movieRepository;
    private final ShowTimeRepository showTimeRepository;
    private final Clock clock;

    public CatalogueService(CityRepository cityRepository, MovieRepository movieRepository,
                            ShowTimeRepository showTimeRepository, Clock clock) {
        this.cityRepository = cityRepository;
        this.movieRepository = movieRepository;
        this.showTimeRepository = showTimeRepository;
        this.clock = clock;
    }

    public List<CityDto> listCities() {
        return cityRepository.findAll(Sort.by("name")).stream().map(CityDto::from).toList();
    }

    /**
     * Movies currently playing in a city. The optional filters are applied in memory:
     * a city has a few dozen movies at most, so this keeps the query simple.
     */
    public List<MovieSummary> listNowShowing(String citySlug, String language, String genre, String search) {
        requireCity(citySlug);
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        return movieRepository.findPlayingInCity(citySlug, LocalDateTime.now(clock)).stream()
                .filter(m -> isBlank(language) || containsIgnoreCase(m.getLanguages(), language))
                .filter(m -> isBlank(genre) || containsIgnoreCase(m.getGenres(), genre))
                .filter(m -> query.isEmpty() || m.getTitle().toLowerCase(Locale.ROOT).contains(query))
                .sorted(Comparator.comparingDouble(Movie::getRating).reversed())
                .map(MovieSummary::from)
                .toList();
    }

    public List<MovieSummary> listComingSoon() {
        return movieRepository.findByStatusOrderByReleaseDateAsc(MovieStatus.COMING_SOON).stream()
                .map(MovieSummary::from)
                .toList();
    }

    public MovieDetail getMovie(String slug) {
        return MovieDetail.from(requireMovie(slug));
    }

    /** Shows for a movie in a city on one day, grouped by theatre. Shows that already started are left out. */
    public List<TheatreShows> listShows(String movieSlug, String citySlug, LocalDate date) {
        requireMovie(movieSlug);
        requireCity(citySlug);

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate day = date == null ? now.toLocalDate() : date;
        if (day.isBefore(now.toLocalDate())) {
            throw new BadRequestException("Date cannot be in the past");
        }

        LocalDateTime from = day.equals(now.toLocalDate()) ? now : day.atStartOfDay();
        LocalDateTime to = day.plusDays(1).atStartOfDay();

        Map<Long, TheatreShows> byTheatre = new LinkedHashMap<>();
        for (ShowTime show : showTimeRepository.findForMovieInCity(movieSlug, citySlug, from, to)) {
            Theatre theatre = show.getScreen().getTheatre();
            byTheatre.computeIfAbsent(theatre.getId(), id -> new TheatreShows(
                            id, theatre.getName(), theatre.getArea(), theatre.getAddress(), new ArrayList<>()))
                    .shows()
                    .add(ShowSlot.from(show));
        }
        return List.copyOf(byTheatre.values());
    }

    private Movie requireMovie(String slug) {
        return movieRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Movie not found: " + slug));
    }

    private void requireCity(String slug) {
        if (!cityRepository.existsBySlug(slug)) {
            throw new NotFoundException("City not found: " + slug);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean containsIgnoreCase(Iterable<String> values, String wanted) {
        for (String value : values) {
            if (value.equalsIgnoreCase(wanted.trim())) {
                return true;
            }
        }
        return false;
    }
}
