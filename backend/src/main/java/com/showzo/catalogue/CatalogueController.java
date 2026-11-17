package com.showzo.catalogue;

import com.showzo.catalogue.CatalogueDtos.CityDto;
import com.showzo.catalogue.CatalogueDtos.MovieDetail;
import com.showzo.catalogue.CatalogueDtos.MovieSummary;
import com.showzo.catalogue.CatalogueDtos.TheatreShows;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogueController {

    private final CatalogueService catalogueService;

    public CatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    @GetMapping("/cities")
    public List<CityDto> cities() {
        return catalogueService.listCities();
    }

    @GetMapping("/movies")
    public List<MovieSummary> nowShowing(@RequestParam("city") String city,
                                         @RequestParam(name = "language", required = false) String language,
                                         @RequestParam(name = "genre", required = false) String genre,
                                         @RequestParam(name = "q", required = false) String search) {
        return catalogueService.listNowShowing(city, language, genre, search);
    }

    @GetMapping("/movies/coming-soon")
    public List<MovieSummary> comingSoon() {
        return catalogueService.listComingSoon();
    }

    @GetMapping("/movies/{slug}")
    public MovieDetail movie(@PathVariable("slug") String slug) {
        return catalogueService.getMovie(slug);
    }

    @GetMapping("/movies/{slug}/shows")
    public List<TheatreShows> shows(@PathVariable("slug") String slug,
                                    @RequestParam("city") String city,
                                    @RequestParam(name = "date", required = false)
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return catalogueService.listShows(slug, city, date);
    }
}
