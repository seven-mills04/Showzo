package com.showzo.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SeatReservationRepository extends JpaRepository<SeatReservation, Long> {

    /** Booked seats plus holds that have not lapsed yet. */
    @Query("""
            select r
            from SeatReservation r
            join fetch r.user
            where r.show.id = :showId
              and (r.status = com.showzo.booking.SeatStatus.BOOKED or r.expiresAt > :now)
            """)
    List<SeatReservation> findActiveForShow(@Param("showId") Long showId, @Param("now") Instant now);

    @Modifying
    @Query("""
            delete from SeatReservation r
            where r.show.id = :showId
              and r.status = com.showzo.booking.SeatStatus.HELD
              and r.expiresAt <= :now
            """)
    int deleteExpiredForShow(@Param("showId") Long showId, @Param("now") Instant now);

    @Modifying
    @Query("""
            delete from SeatReservation r
            where r.status = com.showzo.booking.SeatStatus.HELD and r.expiresAt <= :now
            """)
    int deleteAllExpired(@Param("now") Instant now);

    @Modifying
    @Query("""
            delete from SeatReservation r
            where r.show.id = :showId
              and r.user.id = :userId
              and r.status = com.showzo.booking.SeatStatus.HELD
            """)
    int deleteHoldsOfUser(@Param("showId") Long showId, @Param("userId") Long userId);
}
