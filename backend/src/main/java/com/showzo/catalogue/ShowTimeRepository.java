package com.showzo.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowTimeRepository extends JpaRepository<ShowTime, Long> {

    boolean existsByScreenIdAndStartTimeBetween(Long screenId, LocalDateTime from, LocalDateTime to);

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
