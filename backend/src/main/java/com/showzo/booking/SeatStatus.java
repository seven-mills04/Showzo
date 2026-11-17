package com.showzo.booking;

public enum SeatStatus {
    /** Temporarily reserved while the user is checking out. Expires on its own. */
    HELD,
    /** Paid for. Permanent. */
    BOOKED
}
