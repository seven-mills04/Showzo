package com.showzo.payment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Signature checking needs no network and no real keys, so it is tested with a made-up secret. */
class RazorpayGatewayTest {

    private static final String SECRET = "test-secret-not-a-real-key";

    private final RazorpayGateway gateway = new RazorpayGateway("rzp_test_example", SECRET);

    @Test
    void hmacMatchesAKnownPublishedExample() {
        // Standard HMAC-SHA256 test vector.
        assertEquals("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
                RazorpayGateway.hmacSha256Hex("The quick brown fox jumps over the lazy dog", "key"));
    }

    @Test
    void acceptsASignatureMadeWithTheSecret() {
        String signature = RazorpayGateway.hmacSha256Hex("order_abc|pay_xyz", SECRET);
        assertTrue(gateway.isPaymentGenuine("order_abc", "pay_xyz", signature));
    }

    @Test
    void rejectsForgedOrMismatchedPayments() {
        String signature = RazorpayGateway.hmacSha256Hex("order_abc|pay_xyz", SECRET);

        assertFalse(gateway.isPaymentGenuine("order_abc", "pay_other", signature), "different payment id");
        assertFalse(gateway.isPaymentGenuine("order_other", "pay_xyz", signature), "different order id");
        assertFalse(gateway.isPaymentGenuine("order_abc", "pay_xyz", "0".repeat(64)), "made-up signature");
        assertFalse(gateway.isPaymentGenuine("order_abc", "pay_xyz",
                RazorpayGateway.hmacSha256Hex("order_abc|pay_xyz", "wrong-secret")), "signed with another key");
        assertFalse(gateway.isPaymentGenuine("order_abc", "pay_xyz", null));
    }

    @Test
    void exposesOnlyThePublicKey() {
        assertEquals("rzp_test_example", gateway.publicKey());
        assertEquals("RAZORPAY", gateway.name());
    }
}
