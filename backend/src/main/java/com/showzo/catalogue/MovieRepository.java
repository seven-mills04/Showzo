package com.showzo.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Optional<Movie> findBySlug(String slug);

    List<Movie> findByStatusOrderByReleaseDateAsc(MovieStatus status);

    /** Movies that still have at least one upcoming show in the given city. */
    @Query("""
            select distinct m
            from ShowTime s
            join s.movie m
            join s.screen sc
            join sc.theatre t
            join t.city c
            where c.slug = :citySlug and s.startTime >= :from
            """)
    List<Movie> findPlayingInCity(@Param("citySlug") String citySlug, @Param("from") LocalDateTime from);
}
