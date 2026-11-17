package com.showzo;

import com.showzo.booking.SeatLayout;
import com.showzo.booking.SeatLayout.Tier;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SeatLayoutTest {

    private final SeatLayout layout = new SeatLayout(10, 14);

    @Test
    void acceptsOnlySeatsThatExistOnTheScreen() {
        assertTrue(layout.isValid("A1"));
        assertTrue(layout.isValid("J14"));

        assertFalse(layout.isValid("K1"), "row K is beyond the 10th row");
        assertFalse(layout.isValid("A15"), "only 14 seats per row");
        assertFalse(layout.isValid("A0"));
        assertFalse(layout.isValid("a1"));
        assertFalse(layout.isValid("AA1"));
        assertFalse(layout.isValid(""));
        assertFalse(layout.isValid(null));
    }

    @Test
    void frontRowsAreClassicBackRowsAreRecliners() {
        assertEquals(Tier.CLASSIC, layout.tierOfRow(0));
        assertEquals(Tier.CLASSIC, layout.tierOfRow(2));
        assertEquals(Tier.PRIME, layout.tierOfRow(3));
        assertEquals(Tier.PRIME, layout.tierOfRow(7));
        assertEquals(Tier.RECLINER, layout.tierOfRow(8));
        assertEquals(Tier.RECLINER, layout.tierOfRow(9));
    }

    @Test
    void priceIsBasePlusTierSurcharge() {
        BigDecimal base = BigDecimal.valueOf(200);
        assertEquals(BigDecimal.valueOf(200), layout.priceOf("A1", base));
        assertEquals(BigDecimal.valueOf(250), layout.priceOf("D5", base));
        assertEquals(BigDecimal.valueOf(350), layout.priceOf("J14", base));
        assertThrows(IllegalArgumentException.class, () -> layout.priceOf("Z9", base));
    }
}
