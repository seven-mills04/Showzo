package com.showzo.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CityRepository extends JpaRepository<City, Long> {

    boolean existsBySlug(String slug);
}
