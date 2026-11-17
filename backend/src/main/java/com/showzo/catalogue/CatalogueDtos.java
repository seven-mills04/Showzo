package com.showzo.catalogue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Response shapes returned by the catalogue API. Entities are never sent to the client directly. */
public final class CatalogueDtos {

    private CatalogueDtos() {
    }

    public record CityDto(Long id, String name, String slug) {
        static CityDto from(City city) {
            return new CityDto(city.getId(), city.getName(), city.getSlug());
        }
    }

    public record MovieSummary(Long id, String title, String slug, String certificate, double rating, int votes,
                               String accentColor, LocalDate releaseDate, List<String> genres,
                               List<String> languages) {
        static MovieSummary from(Movie movie) {
            return new MovieSummary(movie.getId(), movie.getTitle(), movie.getSlug(), movie.getCertificate(),
                    movie.getRating(), movie.getVotes(), movie.getAccentColor(), movie.getReleaseDate(),
                    movie.getGenres().stream().sorted().toList(),
                    movie.getLanguages().stream().sorted().toList());
        }
    }

    public record MovieDetail(Long id, String title, String slug, String synopsis, int durationMinutes,
                              String certificate, double rating, int votes, String accentColor,
                              LocalDate releaseDate, MovieStatus status, List<String> genres,
                              List<String> languages) {
        static MovieDetail from(Movie movie) {
            return new MovieDetail(movie.getId(), movie.getTitle(), movie.getSlug(), movie.getSynopsis(),
                    movie.getDurationMinutes(), movie.getCertificate(), movie.getRating(), movie.getVotes(),
                    movie.getAccentColor(), movie.getReleaseDate(), movie.getStatus(),
                    movie.getGenres().stream().sorted().toList(),
                    movie.getLanguages().stream().sorted().toList());
        }
    }

    public record ShowSlot(Long id, LocalDateTime startTime, String language, String format, String screenName,
                           BigDecimal basePrice) {
        static ShowSlot from(ShowTime show) {
            return new ShowSlot(show.getId(), show.getStartTime(), show.getLanguage(),
                    show.getScreen().getFormat(), show.getScreen().getName(), show.getBasePrice());
        }
    }

    /** All shows of a movie at one theatre on one day. */
    public record TheatreShows(Long theatreId, String theatreName, String area, String address,
                               List<ShowSlot> shows) {
    }
}
