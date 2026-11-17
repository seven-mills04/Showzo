package com.showzo.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class BookingDtos {

    private BookingDtos() {
    }

    /** status is one of AVAILABLE, HELD, BOOKED or YOURS (held by the person asking). */
    public record SeatView(String label, int number, String status) {
    }

    public record RowView(String row, String tier, BigDecimal price, List<SeatView> seats) {
    }

    public record SeatMap(Long showId, String movieTitle, String movieSlug, String theatreName, String screenName,
                          String format, String language, LocalDateTime startTime, int maxSeats,
                          Instant yourHoldExpiresAt, List<RowView> rows) {
    }

    public record HoldRequest(@NotEmpty List<@NotBlank String> seats) {
    }

    public record HoldResponse(Long showId, List<String> seats, BigDecimal totalAmount, Instant expiresAt) {
    }
}
