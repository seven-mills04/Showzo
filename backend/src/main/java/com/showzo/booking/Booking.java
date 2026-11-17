package com.showzo.booking;

import com.showzo.catalogue.ShowTime;
import com.showzo.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Short code printed on the ticket and encoded in its QR code, e.g. "SZ7K2M9QXA". */
    @Column(nullable = false, unique = true, length = 12)
    private String bookingRef;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "show_id")
    private ShowTime show;

    /** Seat labels joined with commas, e.g. "C4,C5". */
    @Column(nullable = false, length = 80)
    private String seatLabels;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ticketAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal convenienceFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private BookingStatus status;

    @Column(nullable = false, unique = true, length = 60)
    private String gatewayOrderId;

    @Column(length = 60)
    private String gatewayPaymentId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant confirmedAt;

    protected Booking() {
    }

    public Booking(String bookingRef, User user, ShowTime show, List<String> seats, BigDecimal ticketAmount,
                   BigDecimal convenienceFee, String gatewayOrderId, Instant createdAt) {
        this.bookingRef = bookingRef;
        this.user = user;
        this.show = show;
        this.seatLabels = String.join(",", seats);
        this.ticketAmount = ticketAmount;
        this.convenienceFee = convenienceFee;
        this.totalAmount = ticketAmount.add(convenienceFee);
        this.status = BookingStatus.PENDING;
        this.gatewayOrderId = gatewayOrderId;
        this.createdAt = createdAt;
    }

    public void confirm(String paymentId, Instant when) {
        this.status = BookingStatus.CONFIRMED;
        this.gatewayPaymentId = paymentId;
        this.confirmedAt = when;
    }

    public void fail(String paymentId) {
        this.status = BookingStatus.FAILED;
        this.gatewayPaymentId = paymentId;
    }

    public List<String> seats() {
        return Arrays.asList(seatLabels.split(","));
    }

    public Long getId() {
        return id;
    }

    public String getBookingRef() {
        return bookingRef;
    }

    public User getUser() {
        return user;
    }

    public ShowTime getShow() {
        return show;
    }

    public BigDecimal getTicketAmount() {
        return ticketAmount;
    }

    public BigDecimal getConvenienceFee() {
        return convenienceFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public String getGatewayPaymentId() {
        return gatewayPaymentId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }
}
