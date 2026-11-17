package com.showzo.booking;

import com.showzo.booking.BookingDtos.BookingView;
import com.showzo.booking.BookingDtos.CheckoutResponse;
import com.showzo.booking.BookingDtos.ConfirmRequest;
import com.showzo.catalogue.ShowTime;
import com.showzo.catalogue.ShowTimeRepository;
import com.showzo.common.BadRequestException;
import com.showzo.common.NotFoundException;
import com.showzo.payment.PaymentGateway;
import com.showzo.user.User;
import com.showzo.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Checkout in two steps:
 * 1. checkout(): price the user's held seats, create a payment order, save a PENDING booking.
 * 2. confirm(): verify the payment, turn the holds into booked seats, mark the booking CONFIRMED.
 */
@Service
public class BookingService {

    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final BookingRepository bookingRepository;
    private final SeatReservationRepository reservationRepository;
    private final ShowTimeRepository showTimeRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;
    private final Clock clock;
    private final Duration holdDuration;
    private final BigDecimal feePerSeat;

    public BookingService(BookingRepository bookingRepository, SeatReservationRepository reservationRepository,
                          ShowTimeRepository showTimeRepository, UserRepository userRepository,
                          PaymentGateway paymentGateway, Clock clock,
                          @Value("${showzo.booking.hold-minutes}") long holdMinutes,
                          @Value("${showzo.booking.convenience-fee-per-seat}") BigDecimal feePerSeat) {
        this.bookingRepository = bookingRepository;
        this.reservationRepository = reservationRepository;
        this.showTimeRepository = showTimeRepository;
        this.userRepository = userRepository;
        this.paymentGateway = paymentGateway;
        this.clock = clock;
        this.holdDuration = Duration.ofMinutes(holdMinutes);
        this.feePerSeat = feePerSeat;
    }

    @Transactional
    public CheckoutResponse checkout(String email, Long showId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        ShowTime show = showTimeRepository.findDetailedById(showId)
                .orElseThrow(() -> new NotFoundException("Show not found: " + showId));
        if (!show.getStartTime().isAfter(LocalDateTime.now(clock))) {
            throw new BadRequestException("This show has already started");
        }

        Instant now = Instant.now(clock);
        List<SeatReservation> holds = reservationRepository
                .findByShowIdAndUserIdAndStatus(showId, user.getId(), SeatStatus.HELD).stream()
                .filter(hold -> hold.getExpiresAt().isAfter(now))
                .toList();
        if (holds.isEmpty()) {
            throw new BadRequestException("Your seats are no longer held. Please select them again.");
        }

        // The price is always worked out on the server. An amount sent by the browser is never trusted.
        SeatLayout layout = SeatLayout.of(show.getScreen());
        List<String> seats = holds.stream().map(SeatReservation::getSeatLabel).sorted().toList();
        BigDecimal ticketAmount = seats.stream()
                .map(label -> layout.priceOf(label, show.getBasePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal convenienceFee = feePerSeat.multiply(BigDecimal.valueOf(seats.size()));
        BigDecimal total = ticketAmount.add(convenienceFee);
        long amountInPaise = total.movePointRight(2).longValueExact();

        // Give the user a fresh full hold window to finish paying.
        Instant holdExpiresAt = now.plus(holdDuration);
        holds.forEach(hold -> hold.setExpiresAt(holdExpiresAt));

        String bookingRef = newBookingRef();
        String orderId = paymentGateway.createOrder(amountInPaise, bookingRef);
        Booking booking = bookingRepository.save(new Booking(
                bookingRef, user, show, seats, ticketAmount, convenienceFee, orderId, now));

        return new CheckoutResponse(booking.getId(), bookingRef, paymentGateway.name(),
                paymentGateway.publicKey(), orderId, amountInPaise, "INR", seats,
                ticketAmount, convenienceFee, total, holdExpiresAt);
    }

    @Transactional
    public BookingView confirm(String email, Long bookingId, ConfirmRequest request) {
        Booking booking = bookingRepository.findOwned(bookingId, email)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        // The same confirmation arriving twice (double click, retry) must not fail or book twice.
        if (booking.getStatus() == BookingStatus.CONFIRMED
                && request.paymentId().equals(booking.getGatewayPaymentId())) {
            return BookingView.from(booking);
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("This booking can no longer be paid for");
        }

        boolean genuine = request.orderId().equals(booking.getGatewayOrderId())
                && paymentGateway.isPaymentGenuine(request.orderId(), request.paymentId(), request.signature());
        if (!genuine) {
            throw new BadRequestException("Payment could not be verified");
        }

        Set<String> wanted = new HashSet<>(booking.seats());
        List<SeatReservation> holds = reservationRepository
                .findByShowIdAndUserIdAndStatus(booking.getShow().getId(), booking.getUser().getId(),
                        SeatStatus.HELD).stream()
                .filter(hold -> wanted.contains(hold.getSeatLabel()))
                .toList();

        if (holds.size() != wanted.size()) {
            // The hold lapsed and the seats went to someone else while the user was paying.
            // A live system would trigger a refund here.
            booking.fail(request.paymentId());
            return BookingView.from(booking);
        }

        holds.forEach(SeatReservation::markBooked);
        booking.confirm(request.paymentId(), Instant.now(clock));
        return BookingView.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingView> myBookings(String email) {
        return bookingRepository.findConfirmedOf(email).stream().map(BookingView::from).toList();
    }

    @Transactional(readOnly = true)
    public BookingView myBooking(String email, Long bookingId) {
        return bookingRepository.findOwned(bookingId, email)
                .map(BookingView::from)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    /** e.g. "SZ7K2M9QXA". Letters and digits that look alike (0/O, 1/I) are left out. */
    private static String newBookingRef() {
        StringBuilder ref = new StringBuilder("SZ");
        for (int i = 0; i < 8; i++) {
            ref.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
        }
        return ref.toString();
    }
}
