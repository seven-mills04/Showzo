package com.showzo.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class AppConfig {

    public static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    /** Show times are stored in Indian time, so "now" is always read through this clock. */
    @Bean
    public Clock clock() {
        return Clock.system(INDIA);
    }
}
