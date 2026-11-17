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
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * One taken seat for one show. A row exists only while a seat is held or booked;
 * a free seat has no row at all.
 *
 * The unique constraint on (show, seat) is what prevents double booking: if two people
 * try to take the same seat at the same moment, the database accepts one insert and
 * rejects the other, no matter how many copies of the server are running.
 */
@Entity
@Table(name = "seat_reservations", uniqueConstraints =
@UniqueConstraint(name = "uk_show_seat", columnNames = {"show_id", "seat_label"}))
public class SeatReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "show_id")
    private ShowTime show;

    /** Row letter plus seat number, e.g. "C7". */
    @Column(name = "seat_label", nullable = false, length = 4)
    private String seatLabel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SeatStatus status;

    /** When a hold lapses. Null once the seat is booked. */
    private Instant expiresAt;

    protected SeatReservation() {
    }

    public static SeatReservation hold(ShowTime show, String seatLabel, User user, Instant expiresAt) {
        SeatReservation reservation = new SeatReservation();
        reservation.show = show;
        reservation.seatLabel = seatLabel;
        reservation.user = user;
        reservation.status = SeatStatus.HELD;
        reservation.expiresAt = expiresAt;
        return reservation;
    }

    public Long getId() {
        return id;
    }

    public ShowTime getShow() {
        return show;
    }

    public String getSeatLabel() {
        return seatLabel;
    }

    public User getUser() {
        return user;
    }

    public SeatStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    /** Turns a hold into a permanent booking once payment is verified. */
    public void markBooked() {
        this.status = SeatStatus.BOOKED;
        this.expiresAt = null;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
