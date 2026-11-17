package com.showzo.booking;

import com.showzo.booking.BookingDtos.BookingView;
import com.showzo.booking.BookingDtos.CheckoutResponse;
import com.showzo.booking.BookingDtos.ConfirmRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** All endpoints here need a logged-in user. */
@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/shows/{showId}/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(@PathVariable("showId") Long showId, Authentication authentication) {
        return bookingService.checkout(authentication.getName(), showId);
    }

    @PostMapping("/bookings/{bookingId}/confirm")
    public BookingView confirm(@PathVariable("bookingId") Long bookingId,
                               @Valid @RequestBody ConfirmRequest request, Authentication authentication) {
        return bookingService.confirm(authentication.getName(), bookingId, request);
    }

    @GetMapping("/bookings")
    public List<BookingView> myBookings(Authentication authentication) {
        return bookingService.myBookings(authentication.getName());
    }

    @GetMapping("/bookings/{bookingId}")
    public BookingView myBooking(@PathVariable("bookingId") Long bookingId, Authentication authentication) {
        return bookingService.myBooking(authentication.getName(), bookingId);
    }
}
