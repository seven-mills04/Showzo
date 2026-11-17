package com.showzo.booking;

public enum BookingStatus {
    /** Checkout started, payment not yet verified. */
    PENDING,
    /** Paid and seats booked. */
    CONFIRMED,
    /** Payment was verified but the seats were no longer held, so nothing was booked. */
    FAILED
}
