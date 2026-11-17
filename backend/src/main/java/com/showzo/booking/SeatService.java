package com.showzo.booking;

import com.showzo.booking.BookingDtos.HoldResponse;
import com.showzo.booking.BookingDtos.RowView;
import com.showzo.booking.BookingDtos.SeatMap;
import com.showzo.booking.BookingDtos.SeatView;
import com.showzo.catalogue.ShowTime;
import com.showzo.catalogue.ShowTimeRepository;
import com.showzo.common.BadRequestException;
import com.showzo.common.ConflictException;
import com.showzo.common.NotFoundException;
import com.showzo.user.User;
import com.showzo.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SeatService {

    private final SeatReservationRepository reservationRepository;
    private final ShowTimeRepository showTimeRepository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final Duration holdDuration;
    private final int maxSeats;

    public SeatService(SeatReservationRepository reservationRepository, ShowTimeRepository showTimeRepository,
                       UserRepository userRepository, Clock clock,
                       @Value("${showzo.booking.hold-minutes}") long holdMinutes,
                       @Value("${showzo.booking.max-seats}") int maxSeats) {
        this.reservationRepository = reservationRepository;
        this.showTimeRepository = showTimeRepository;
        this.userRepository = userRepository;
        this.clock = clock;
        this.holdDuration = Duration.ofMinutes(holdMinutes);
        this.maxSeats = maxSeats;
    }

    /**
     * The seat map of a show. Works without login; if the caller is logged in,
     * the seats they are holding are marked YOURS instead of HELD.
     */
    @Transactional(readOnly = true)
    public SeatMap seatMap(Long showId, String emailOrNull) {
        ShowTime show = requireShow(showId);
        SeatLayout layout = SeatLayout.of(show.getScreen());
        Instant now = Instant.now(clock);

        Map<String, SeatReservation> taken = reservationRepository.findActiveForShow(showId, now).stream()
                .collect(Collectors.toMap(SeatReservation::getSeatLabel, Function.identity()));

        Instant yourHoldExpiresAt = null;
        List<RowView> rows = new ArrayList<>();
        for (int rowIndex = 0; rowIndex < layout.totalRows(); rowIndex++) {
            List<SeatView> seats = new ArrayList<>();
            for (int number = 1; number <= layout.seatsPerRow(); number++) {
                String label = SeatLayout.label(rowIndex, number);
                SeatReservation reservation = taken.get(label);
                String status = "AVAILABLE";
                if (reservation != null) {
                    boolean mine = reservation.getUser().getEmail().equals(emailOrNull);
                    if (reservation.getStatus() == SeatStatus.BOOKED) {
                        status = "BOOKED";
                    } else if (mine) {
                        status = "YOURS";
                        yourHoldExpiresAt = reservation.getExpiresAt();
                    } else {
                        status = "HELD";
                    }
                }
                seats.add(new SeatView(label, number, status));
            }
            rows.add(new RowView(SeatLayout.rowLetter(rowIndex), layout.tierOfRow(rowIndex).name(),
                    layout.priceOfRow(rowIndex, show.getBasePrice()), seats));
        }

        return new SeatMap(show.getId(), show.getMovie().getTitle(), show.getMovie().getSlug(),
                show.getScreen().getTheatre().getName(), show.getScreen().getName(),
                show.getScreen().getFormat(), show.getLanguage(), show.getStartTime(), maxSeats,
                yourHoldExpiresAt, rows);
    }

    /**
     * Holds the given seats for the user for a few minutes, replacing any seats they held before
     * for this show. All-or-nothing: if even one seat is taken, none are held.
     *
     * There is no "check if free, then save" step here, because two requests could both pass the
     * check before either saves. Instead the rows are inserted directly and the unique constraint
     * on (show, seat) decides the winner.
     *
     * READ_COMMITTED keeps MySQL from taking gap locks on the deletes below, which could
     * otherwise make two people picking different seats block each other.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public HoldResponse holdSeats(String email, Long showId, List<String> requestedSeats) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        ShowTime show = requireShow(showId);
        if (!show.getStartTime().isAfter(LocalDateTime.now(clock))) {
            throw new BadRequestException("This show has already started");
        }

        SeatLayout layout = SeatLayout.of(show.getScreen());
        List<String> seats = requestedSeats.stream()
                .map(label -> label.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
        if (seats.size() > maxSeats) {
            throw new BadRequestException("You can book at most " + maxSeats + " seats at a time");
        }
        for (String label : seats) {
            if (!layout.isValid(label)) {
                throw new BadRequestException("No such seat: " + label);
            }
        }

        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(holdDuration);
        try {
            reservationRepository.deleteExpiredForShow(showId, now);
            reservationRepository.deleteHoldsOfUser(showId, user.getId());
            reservationRepository.saveAllAndFlush(seats.stream()
                    .map(label -> SeatReservation.hold(show, label, user, expiresAt))
                    .toList());
        } catch (DataIntegrityViolationException | ConcurrencyFailureException ex) {
            // Someone else's insert got there first. The transaction rolls back, so the
            // user's earlier holds (deleted above) come back untouched.
            throw new ConflictException("One or more of those seats were just taken. Please pick again.");
        }

        BigDecimal total = seats.stream()
                .map(label -> layout.priceOf(label, show.getBasePrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new HoldResponse(showId, seats, total, expiresAt);
    }

    @Transactional
    public void releaseHolds(String email, Long showId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        reservationRepository.deleteHoldsOfUser(showId, user.getId());
    }

    /** Lapsed holds are already ignored when reading; this just clears them out of the table. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    @Transactional
    public void purgeExpiredHolds() {
        reservationRepository.deleteAllExpired(Instant.now(clock));
    }

    private ShowTime requireShow(Long showId) {
        return showTimeRepository.findDetailedById(showId)
                .orElseThrow(() -> new NotFoundException("Show not found: " + showId));
    }
}
