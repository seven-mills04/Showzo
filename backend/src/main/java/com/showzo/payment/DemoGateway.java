package com.showzo.payment;

import java.util.UUID;

/**
 * Used only when no Razorpay keys are configured, so the project still runs end to end
 * for anyone who clones it. No money moves and no card details are collected:
 * the frontend shows a clearly labelled "demo payment" step instead of Razorpay's popup.
 */
public class DemoGateway implements PaymentGateway {

    private static final String ORDER_PREFIX = "demo_order_";
    private static final String PAYMENT_PREFIX = "demo_pay_";

    @Override
    public String name() {
        return "DEMO";
    }

    @Override
    public String publicKey() {
        return null;
    }

    @Override
    public String createOrder(long amountInPaise, String receipt) {
        return ORDER_PREFIX + UUID.randomUUID().toString().replace("-", "");
    }

    @Override
    public boolean isPaymentGenuine(String orderId, String paymentId, String signature) {
        return orderId != null && orderId.startsWith(ORDER_PREFIX)
                && paymentId != null && paymentId.startsWith(PAYMENT_PREFIX);
    }
}
