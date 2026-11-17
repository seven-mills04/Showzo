package com.showzo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ShowzoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShowzoApplication.class, args);
    }
}
