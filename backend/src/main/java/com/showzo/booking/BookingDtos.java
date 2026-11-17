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

    /**
     * Everything the frontend needs to open the payment screen.
     * gateway is "RAZORPAY" or "DEMO"; gatewayKey is the public Razorpay key (null for DEMO).
     */
    public record CheckoutResponse(Long bookingId, String bookingRef, String gateway, String gatewayKey,
                                   String orderId, long amountInPaise, String currency, List<String> seats,
                                   BigDecimal ticketAmount, BigDecimal convenienceFee, BigDecimal totalAmount,
                                   Instant holdExpiresAt) {
    }

    public record ConfirmRequest(@NotBlank String orderId, @NotBlank String paymentId, String signature) {
    }

    public record BookingView(Long id, String bookingRef, String status, String movieTitle, String movieSlug,
                              String accentColor, String certificate, String theatreName, String theatreAddress,
                              String screenName, String format, String language, LocalDateTime startTime,
                              List<String> seats, BigDecimal ticketAmount, BigDecimal convenienceFee,
                              BigDecimal totalAmount, Instant createdAt) {
        static BookingView from(Booking booking) {
            var show = booking.getShow();
            var movie = show.getMovie();
            var screen = show.getScreen();
            return new BookingView(booking.getId(), booking.getBookingRef(), booking.getStatus().name(),
                    movie.getTitle(), movie.getSlug(), movie.getAccentColor(), movie.getCertificate(),
                    screen.getTheatre().getName(), screen.getTheatre().getAddress(), screen.getName(),
                    screen.getFormat(), show.getLanguage(), show.getStartTime(), booking.seats(),
                    booking.getTicketAmount(), booking.getConvenienceFee(), booking.getTotalAmount(),
                    booking.getCreatedAt());
        }
    }
}
