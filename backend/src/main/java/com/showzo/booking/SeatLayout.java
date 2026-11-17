package com.showzo.booking;

import com.showzo.catalogue.Screen;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The seat grid of a screen. Seats are not stored in the database: a screen only records
 * its number of rows and seats per row, and everything else is worked out here.
 * Row A is nearest the screen.
 */
public final class SeatLayout {

    public enum Tier {
        CLASSIC(0), PRIME(50), RECLINER(150);

        private final int surcharge;

        Tier(int surcharge) {
            this.surcharge = surcharge;
        }

        public int surcharge() {
            return surcharge;
        }
    }

    private static final Pattern LABEL = Pattern.compile("^([A-Z])(\\d{1,2})$");
    private static final int CLASSIC_ROWS = 3;
    private static final int RECLINER_ROWS = 2;

    private final int totalRows;
    private final int seatsPerRow;

    public SeatLayout(int totalRows, int seatsPerRow) {
        this.totalRows = totalRows;
        this.seatsPerRow = seatsPerRow;
    }

    public static SeatLayout of(Screen screen) {
        return new SeatLayout(screen.getTotalRows(), screen.getSeatsPerRow());
    }

    public int totalRows() {
        return totalRows;
    }

    public int seatsPerRow() {
        return seatsPerRow;
    }

    public static String rowLetter(int rowIndex) {
        return String.valueOf((char) ('A' + rowIndex));
    }

    public static String label(int rowIndex, int seatNumber) {
        return rowLetter(rowIndex) + seatNumber;
    }

    /** Front rows are cheapest, the last two rows are recliners, the rest are prime. */
    public Tier tierOfRow(int rowIndex) {
        if (rowIndex >= totalRows - RECLINER_ROWS) {
            return Tier.RECLINER;
        }
        if (rowIndex < CLASSIC_ROWS) {
            return Tier.CLASSIC;
        }
        return Tier.PRIME;
    }

    public boolean isValid(String label) {
        return rowIndexOf(label) >= 0;
    }

    public BigDecimal priceOfRow(int rowIndex, BigDecimal basePrice) {
        return basePrice.add(BigDecimal.valueOf(tierOfRow(rowIndex).surcharge()));
    }

    public BigDecimal priceOf(String label, BigDecimal basePrice) {
        int rowIndex = rowIndexOf(label);
        if (rowIndex < 0) {
            throw new IllegalArgumentException("No such seat: " + label);
        }
        return priceOfRow(rowIndex, basePrice);
    }

    /** Row index of a seat label, or -1 if the label does not exist on this screen. */
    private int rowIndexOf(String label) {
        if (label == null) {
            return -1;
        }
        Matcher matcher = LABEL.matcher(label);
        if (!matcher.matches()) {
            return -1;
        }
        int rowIndex = matcher.group(1).charAt(0) - 'A';
        int seatNumber = Integer.parseInt(matcher.group(2));
        boolean exists = rowIndex < totalRows && seatNumber >= 1 && seatNumber <= seatsPerRow;
        return exists ? rowIndex : -1;
    }
}
