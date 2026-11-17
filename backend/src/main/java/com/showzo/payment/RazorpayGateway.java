package com.showzo.payment;

import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/**
 * Talks to Razorpay's REST API directly (no SDK), so every step is visible:
 *
 * 1. createOrder: the server tells Razorpay how much to charge and gets an order id.
 * 2. The browser pays inside Razorpay's popup and receives a payment id and a signature.
 * 3. isPaymentGenuine: the server recomputes the signature with its secret key. Only
 *    Razorpay and this server know that key, so a matching signature proves the payment is real.
 */
public class RazorpayGateway implements PaymentGateway {

    private final String keyId;
    private final String keySecret;
    private final RestClient restClient;

    public RazorpayGateway(String keyId, String keySecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(headers -> headers.setBasicAuth(keyId, keySecret))
                .build();
    }

    @Override
    public String name() {
        return "RAZORPAY";
    }

    @Override
    public String publicKey() {
        return keyId;
    }

    @Override
    public String createOrder(long amountInPaise, String receipt) {
        try {
            Map<?, ?> order = restClient.post()
                    .uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", amountInPaise, "currency", "INR", "receipt", receipt))
                    .retrieve()
                    .body(Map.class);
            if (order == null || order.get("id") == null) {
                throw new PaymentGatewayException("Razorpay returned no order id", null);
            }
            return order.get("id").toString();
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("Could not create the Razorpay order", ex);
        }
    }

    @Override
    public boolean isPaymentGenuine(String orderId, String paymentId, String signature) {
        if (orderId == null || paymentId == null || signature == null) {
            return false;
        }
        String expected = hmacSha256Hex(orderId + "|" + paymentId, keySecret);
        // Constant-time comparison, so response timing leaks nothing about the correct signature.
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
    }

    static String hmacSha256Hex(String message, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("HmacSHA256 is not available", ex);
        }
    }
}
