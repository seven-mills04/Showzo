package com.showzo.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** A booking is only ever looked up together with its owner, so one user cannot read another's ticket. */
    @Query("""
            select b
            from Booking b
            join fetch b.show s
            join fetch s.movie
            join fetch s.screen sc
            join fetch sc.theatre
            where b.id = :id and b.user.email = :email
            """)
    Optional<Booking> findOwned(@Param("id") Long id, @Param("email") String email);

    @Query("""
            select b
            from Booking b
            join fetch b.show s
            join fetch s.movie
            join fetch s.screen sc
            join fetch sc.theatre
            where b.user.email = :email and b.status = com.showzo.booking.BookingStatus.CONFIRMED
            order by b.createdAt desc
            """)
    List<Booking> findConfirmedOf(@Param("email") String email);
}
