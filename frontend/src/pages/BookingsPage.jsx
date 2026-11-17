import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton, Typography } from '@mui/material';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';

import { api } from '../api';
import { colors, display } from '../theme';
import { clock, dayLabel, todayInIndia } from '../format';

function BookingRow({ booking }) {
  const date = dayLabel(booking.startTime);
  const past = booking.startTime.slice(0, 10) < todayInIndia();
  return (
    <Box component={Link} to={`/bookings/${booking.id}`}
      sx={{
        display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, p: { xs: 2, md: 2.5 }, borderRadius: 3,
        bgcolor: colors.surface, border: `1px solid ${colors.line}`, opacity: past ? 0.6 : 1,
        transition: 'border-color .15s ease, transform .15s ease',
        '&:hover, &:focus-visible': { borderColor: colors.accent, transform: 'translateX(4px)' },
      }}>
      <Box sx={{
        width: 64, flexShrink: 0, textAlign: 'center', py: 1, borderRadius: 2, color: '#fff',
        background: `linear-gradient(160deg, ${booking.accentColor}, color-mix(in srgb, ${booking.accentColor} 45%, #000))`,
      }}>
        <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85 }}>{date.month.toUpperCase()}</Box>
        <Box sx={{ fontFamily: display, fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{date.day}</Box>
        <Box sx={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{date.weekday}</Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" noWrap>{booking.movieTitle}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {clock(booking.startTime)} · {booking.theatreName}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: colors.accent }}>
          {booking.seats.join(', ')}
          <Box component="span" sx={{ color: colors.muted, fontWeight: 500 }}> · {booking.bookingRef}</Box>
        </Typography>
      </Box>
      <ChevronRightRounded sx={{ color: colors.muted }} />
    </Box>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.bookings().then(setBookings).catch((e) => setError(e.message));
  }, []);

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 3, md: 6 } }}>
      <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>My bookings</Typography>
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
        {!bookings && !error && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={104} />)}
        {bookings && bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
      </Box>

      {bookings && bookings.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center', border: `1px dashed ${colors.line}`, borderRadius: 3 }}>
          <Typography variant="h5">No tickets yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Your booked tickets will appear here.</Typography>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>Find a movie</Button>
        </Box>
      )}
    </Container>
  );
}
