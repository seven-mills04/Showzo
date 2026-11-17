package com.showzo.catalogue;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 1000)
    private String synopsis;

    @Column(nullable = false)
    private int durationMinutes;

    /** Censor certificate: U, UA or A. */
    @Column(nullable = false, length = 4)
    private String certificate;

    private LocalDate releaseDate;

    /** Average rating out of 10. */
    private double rating;

    private int votes;

    /** Colour used by the frontend to draw the poster artwork. */
    @Column(length = 9)
    private String accentColor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MovieStatus status;

    @ElementCollection
    @CollectionTable(name = "movie_genres", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "genre", nullable = false)
    private Set<String> genres = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "movie_languages", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "language", nullable = false)
    private Set<String> languages = new LinkedHashSet<>();

    protected Movie() {
    }

    public Movie(String title, String slug, String synopsis, int durationMinutes, String certificate,
                 LocalDate releaseDate, double rating, int votes, String accentColor, MovieStatus status,
                 Set<String> genres, Set<String> languages) {
        this.title = title;
        this.slug = slug;
        this.synopsis = synopsis;
        this.durationMinutes = durationMinutes;
        this.certificate = certificate;
        this.releaseDate = releaseDate;
        this.rating = rating;
        this.votes = votes;
        this.accentColor = accentColor;
        this.status = status;
        this.genres = new LinkedHashSet<>(genres);
        this.languages = new LinkedHashSet<>(languages);
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getCertificate() {
        return certificate;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public double getRating() {
        return rating;
    }

    public int getVotes() {
        return votes;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public MovieStatus getStatus() {
        return status;
    }

    public Set<String> getGenres() {
        return genres;
    }

    public Set<String> getLanguages() {
        return languages;
    }
}
