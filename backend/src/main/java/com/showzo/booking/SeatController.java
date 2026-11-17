package com.showzo.booking;

import com.showzo.booking.BookingDtos.HoldRequest;
import com.showzo.booking.BookingDtos.HoldResponse;
import com.showzo.booking.BookingDtos.SeatMap;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shows/{showId}")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    /** Public. The Authentication is null for visitors who are not logged in. */
    @GetMapping("/seats")
    public SeatMap seatMap(@PathVariable("showId") Long showId, Authentication authentication) {
        String email = authentication == null ? null : authentication.getName();
        return seatService.seatMap(showId, email);
    }

    @PostMapping("/holds")
    @ResponseStatus(HttpStatus.CREATED)
    public HoldResponse hold(@PathVariable("showId") Long showId, @Valid @RequestBody HoldRequest request,
                             Authentication authentication) {
        return seatService.holdSeats(authentication.getName(), showId, request.seats());
    }

    @DeleteMapping("/holds")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void release(@PathVariable("showId") Long showId, Authentication authentication) {
        seatService.releaseHolds(authentication.getName(), showId);
    }
}
