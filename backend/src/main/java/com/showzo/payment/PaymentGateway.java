package com.showzo.payment;

/**
 * What the booking code needs from a payment provider. Keeping it behind an interface means
 * the booking logic does not care whether Razorpay or the keyless demo gateway is in use.
 */
public interface PaymentGateway {

    /** "RAZORPAY" or "DEMO". Sent to the frontend so it knows which payment screen to open. */
    String name();

    /** Public key the frontend passes to the provider's checkout popup. Null for the demo gateway. */
    String publicKey();

    /** Registers the amount with the provider and returns the provider's order id. */
    String createOrder(long amountInPaise, String receipt);

    /** True only if the payment details really came from the provider and were not made up by the caller. */
    boolean isPaymentGenuine(String orderId, String paymentId, String signature);
}
