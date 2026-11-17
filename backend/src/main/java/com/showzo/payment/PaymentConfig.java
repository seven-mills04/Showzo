package com.showzo.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentConfig {

    private static final Logger log = LoggerFactory.getLogger(PaymentConfig.class);

    /** Razorpay when both keys are set (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET), otherwise the demo gateway. */
    @Bean
    public PaymentGateway paymentGateway(@Value("${showzo.razorpay.key-id}") String keyId,
                                         @Value("${showzo.razorpay.key-secret}") String keySecret) {
        if (keyId.isBlank() || keySecret.isBlank()) {
            log.warn("Razorpay keys are not set: using the demo payment gateway");
            return new DemoGateway();
        }
        log.info("Using Razorpay for payments");
        return new RazorpayGateway(keyId.trim(), keySecret.trim());
    }
}
