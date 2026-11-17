package com.showzo.catalogue;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One screening of a movie on a screen. Named ShowTime (table show_times)
 * because SHOW is a reserved word in MySQL.
 */
@Entity
@Table(name = "show_times", indexes = {
        @Index(name = "idx_show_movie_start", columnList = "movie_id, start_time"),
        @Index(name = "idx_show_screen_start", columnList = "screen_id, start_time")
})
public class ShowTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "screen_id")
    private Screen screen;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal basePrice;

    protected ShowTime() {
    }

    public ShowTime(Movie movie, Screen screen, LocalDateTime startTime, String language, BigDecimal basePrice) {
        this.movie = movie;
        this.screen = screen;
        this.startTime = startTime;
        this.language = language;
        this.basePrice = basePrice;
    }

    public Long getId() {
        return id;
    }

    public Movie getMovie() {
        return movie;
    }

    public Screen getScreen() {
        return screen;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public String getLanguage() {
        return language;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }
}
