package com.showzo.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShowTimeRepository extends JpaRepository<ShowTime, Long> {

    boolean existsByScreenIdAndStartTimeBetween(Long screenId, LocalDateTime from, LocalDateTime to);

    /** One show with its movie, screen and theatre loaded in the same query. */
    @Query("""
            select s
            from ShowTime s
            join fetch s.movie
            join fetch s.screen sc
            join fetch sc.theatre
            where s.id = :id
            """)
    Optional<ShowTime> findDetailedById(@Param("id") Long id);

    /** Shows of one movie in one city inside a time window, with screen and theatre loaded in the same query. */
    @Query("""
            select s
            from ShowTime s
            join fetch s.screen sc
            join fetch sc.theatre t
            where s.movie.slug = :movieSlug
              and t.city.slug = :citySlug
              and s.startTime >= :from
              and s.startTime < :to
            order by t.name, s.startTime
            """)
    List<ShowTime> findForMovieInCity(@Param("movieSlug") String movieSlug,
                                      @Param("citySlug") String citySlug,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);
}
