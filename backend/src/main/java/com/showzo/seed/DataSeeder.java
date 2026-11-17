package com.showzo.seed;

import com.showzo.catalogue.City;
import com.showzo.catalogue.CityRepository;
import com.showzo.catalogue.Movie;
import com.showzo.catalogue.MovieRepository;
import com.showzo.catalogue.MovieStatus;
import com.showzo.catalogue.Screen;
import com.showzo.catalogue.ScreenRepository;
import com.showzo.catalogue.Theatre;
import com.showzo.catalogue.TheatreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Fills an empty database with demo data on first start: cities, theatres, screens and movies.
 * All movie titles and theatre names are invented for this project.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CityRepository cityRepository;
    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final MovieRepository movieRepository;
    private final ShowPlanner showPlanner;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public DataSeeder(CityRepository cityRepository, TheatreRepository theatreRepository,
                      ScreenRepository screenRepository, MovieRepository movieRepository,
                      ShowPlanner showPlanner, TransactionTemplate transactionTemplate, Clock clock) {
        this.cityRepository = cityRepository;
        this.theatreRepository = theatreRepository;
        this.screenRepository = screenRepository;
        this.movieRepository = movieRepository;
        this.showPlanner = showPlanner;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public void run(String... args) {
        if (cityRepository.count() == 0) {
            // One transaction: either all the demo data is saved or none of it.
            transactionTemplate.executeWithoutResult(status -> {
                seedCitiesAndTheatres();
                seedMovies();
            });
            log.info("Seeded demo catalogue");
        }
        showPlanner.ensureUpcomingShows();
    }

    private void seedCitiesAndTheatres() {
        City delhi = cityRepository.save(new City("Delhi-NCR", "delhi-ncr"));
        City mumbai = cityRepository.save(new City("Mumbai", "mumbai"));
        City bengaluru = cityRepository.save(new City("Bengaluru", "bengaluru"));

        addTheatre(delhi, "Lumina Cinemas", "Saket", "District Centre, Saket, New Delhi", true);
        addTheatre(delhi, "Orbit Multiplex", "Connaught Place", "Outer Circle, Connaught Place, New Delhi", false);
        addTheatre(delhi, "Silverline Screens", "Noida Sector 18", "Atta Market Road, Sector 18, Noida", true);
        addTheatre(delhi, "Lumina Cinemas", "Gurugram Sector 29", "Leisure Valley Road, Sector 29, Gurugram", false);
        addTheatre(delhi, "Carnation Talkies", "Rajouri Garden", "Main Market, Rajouri Garden, New Delhi", false);
        addTheatre(delhi, "Orbit Multiplex", "Indirapuram", "Ahinsa Khand, Indirapuram, Ghaziabad", true);

        addTheatre(mumbai, "Lumina Cinemas", "Andheri West", "Link Road, Andheri West, Mumbai", true);
        addTheatre(mumbai, "Silverline Screens", "Lower Parel", "Senapati Bapat Marg, Lower Parel, Mumbai", false);
        addTheatre(mumbai, "Orbit Multiplex", "Thane West", "Ghodbunder Road, Thane West", false);

        addTheatre(bengaluru, "Lumina Cinemas", "Koramangala", "80 Feet Road, Koramangala, Bengaluru", true);
        addTheatre(bengaluru, "Carnation Talkies", "Whitefield", "ITPL Main Road, Whitefield, Bengaluru", false);
        addTheatre(bengaluru, "Orbit Multiplex", "Indiranagar", "100 Feet Road, Indiranagar, Bengaluru", false);
    }

    private void addTheatre(City city, String brand, String area, String address, boolean hasImax) {
        Theatre theatre = theatreRepository.save(new Theatre(brand + ": " + area, area, address, city));
        screenRepository.save(new Screen("Screen 1", "2D", 10, 14, theatre));
        screenRepository.save(new Screen("Screen 2", "3D", 10, 14, theatre));
        if (hasImax) {
            screenRepository.save(new Screen("Screen 3", "IMAX", 12, 18, theatre));
        }
    }

    private void seedMovies() {
        LocalDate today = LocalDate.now(clock);

        List<Movie> movies = List.of(
                nowShowing("Monsoon Junction",
                        "Two strangers stranded at a flooded railway station have one night to decide whether to board the same train.",
                        142, "UA", today.minusDays(9), 8.7, 48200, "#2F6F8F",
                        Set.of("Drama", "Romance"), Set.of("Hindi")),
                nowShowing("Agent Chaukas",
                        "A retired traffic constable is mistaken for a secret agent and decides not to correct anyone.",
                        151, "UA", today.minusDays(16), 8.1, 91400, "#C2410C",
                        Set.of("Action", "Comedy"), Set.of("Hindi", "Telugu")),
                nowShowing("The Last Local",
                        "The 1:40 am train never reaches its final stop, and a rookie reporter is the only passenger who remembers boarding it.",
                        128, "A", today.minusDays(5), 8.4, 26700, "#3B2F63",
                        Set.of("Thriller", "Mystery"), Set.of("Hindi", "English", "Marathi")),
                nowShowing("Orbit 9",
                        "A maintenance crew on India's ninth space station finds a tenth module that was never launched.",
                        136, "UA", today.minusDays(12), 7.9, 63800, "#0F3D5E",
                        Set.of("Sci-Fi", "Adventure"), Set.of("English", "Hindi")),
                nowShowing("Biryani Wars",
                        "Two rival families, one disputed recipe and a city-wide cook-off judged by their own grandmother.",
                        118, "U", today.minusDays(23), 7.6, 54100, "#B45309",
                        Set.of("Comedy", "Family"), Set.of("Hindi", "Telugu", "Tamil")),
                nowShowing("Shehar Ke Saaye",
                        "A night-shift cab driver starts picking up passengers who all ask for the same address.",
                        124, "A", today.minusDays(2), 7.3, 12900, "#1F2937",
                        Set.of("Horror", "Mystery"), Set.of("Hindi")),
                nowShowing("Kabaddi Kings",
                        "A village team with borrowed shoes fights its way to the national league final.",
                        147, "U", today.minusDays(19), 8.9, 77300, "#166534",
                        Set.of("Sports", "Drama"), Set.of("Hindi", "Punjabi")),
                nowShowing("Papa Ki Scooty",
                        "A father and daughter ride a thirty-year-old scooter from Kanpur to Goa to settle a family bet.",
                        110, "U", today.minusDays(30), 8.2, 39500, "#BE185D",
                        Set.of("Family", "Comedy"), Set.of("Hindi")),
                nowShowing("Neon Ranthambore",
                        "A wildlife ranger and a hacker have 48 hours to stop a poaching ring that runs on a mobile app.",
                        139, "UA", today.minusDays(7), 7.8, 31200, "#7C2D12",
                        Set.of("Action", "Thriller"), Set.of("Hindi", "English")),
                nowShowing("Tara and the Tin Robot",
                        "A ten-year-old builds a robot from kitchen scrap, and it turns out to have opinions.",
                        98, "U", today.minusDays(14), 8.5, 22600, "#0E7490",
                        Set.of("Animation", "Adventure"), Set.of("English", "Hindi")),

                comingSoon("Midnight in Meghalaya",
                        "A tea-estate inheritance brings three estranged siblings back to a house that keeps rearranging itself.",
                        131, "UA", today.plusDays(10), "#14532D",
                        Set.of("Mystery", "Drama"), Set.of("Hindi", "English")),
                comingSoon("Gully Galactic",
                        "An alien exchange student joins a Mumbai street-cricket team three days before the big match.",
                        115, "U", today.plusDays(17), "#5B21B6",
                        Set.of("Comedy", "Sci-Fi"), Set.of("Hindi", "Marathi")),
                comingSoon("The Jaipur Heist",
                        "A crew of wedding planners uses the season's biggest wedding as cover for a palace robbery.",
                        144, "UA", today.plusDays(24), "#9D174D",
                        Set.of("Action", "Comedy"), Set.of("Hindi")),
                comingSoon("Second Innings",
                        "A 41-year-old club cricketer gets one last selection trial, coached by his own son.",
                        138, "U", today.plusDays(31), "#1E3A8A",
                        Set.of("Sports", "Drama"), Set.of("Hindi", "Tamil")));

        movieRepository.saveAll(movies);
    }

    private static Movie nowShowing(String title, String synopsis, int minutes, String certificate,
                                    LocalDate releaseDate, double rating, int votes, String colour,
                                    Set<String> genres, Set<String> languages) {
        return new Movie(title, slugify(title), synopsis, minutes, certificate, releaseDate, rating, votes,
                colour, MovieStatus.NOW_SHOWING, genres, languages);
    }

    private static Movie comingSoon(String title, String synopsis, int minutes, String certificate,
                                    LocalDate releaseDate, String colour,
                                    Set<String> genres, Set<String> languages) {
        return new Movie(title, slugify(title), synopsis, minutes, certificate, releaseDate, 0, 0,
                colour, MovieStatus.COMING_SOON, genres, languages);
    }

    private static String slugify(String title) {
        return title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
