import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton } from '@mui/material';
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded';

import { api } from '../api';
import { colors, label, shout } from '../theme';
import { clock, dayLabel, todayInIndia } from '../format';
import { SectionTitle } from '../components/ui';

function BookingRow({ booking, index }) {
  const date = dayLabel(booking.startTime);
  const past = booking.startTime.slice(0, 10) < todayInIndia();
  return (
    <Box component={Link} to={`/bookings/${booking.id}`}
      sx={{
        display: 'grid', alignItems: 'center', columnGap: { xs: 2, md: 4 }, rowGap: 1, py: { xs: 2.5, md: 3 }, px: { xs: 0, md: 1 },
        gridTemplateColumns: { xs: 'auto 1fr auto', md: '32px auto 1fr auto auto' },
        borderTop: `1px solid ${colors.text}`, opacity: past ? 0.5 : 1,
        transition: 'background-color .18s ease, padding .25s cubic-bezier(.2,.7,.2,1)',
        '& .go': { transition: 'transform .2s ease' },
        '&:hover, &:focus-visible': { bgcolor: colors.accent, px: { md: 3 }, outline: 'none', opacity: 1 },
        '&:hover .go, &:focus-visible .go': { transform: 'translate(3px, -3px)' },
      }}>
      <Box sx={{ ...label, display: { xs: 'none', md: 'block' } }}>{String(index + 1).padStart(2, '0')}</Box>
      <Box sx={{
        width: 62, textAlign: 'center', py: 0.75, borderRadius: 1, color: '#fff', border: `1.5px solid ${colors.text}`,
        background: `linear-gradient(160deg, ${booking.accentColor}, color-mix(in srgb, ${booking.accentColor} 45%, #000))`,
        transform: 'rotate(-4deg)',
      }}>
        <Box sx={{ ...label, fontSize: 10 }}>{date.month}</Box>
        <Box sx={{ ...shout, fontSize: 28, lineHeight: 1 }}>{date.day}</Box>
        <Box sx={{ ...label, fontSize: 10 }}>{date.weekday}</Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ ...shout, fontSize: 'clamp(24px, 4.2vw, 60px)', textWrap: 'balance' }}>{booking.movieTitle}</Box>
        <Box sx={{ ...label, color: colors.muted, mt: 0.75 }}>
          {clock(booking.startTime)} · {booking.theatreName}{past ? ' · Watched' : ''}
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ ...shout, fontSize: 24, lineHeight: 1, letterSpacing: '-0.03em' }}>{booking.seats.join('  ')}</Box>
        <Box sx={{ ...label, color: colors.muted, mt: 0.5 }}>{booking.bookingRef}</Box>
      </Box>
      <ArrowOutwardRounded className="go" />
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
    <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 5 } }}>
      <SectionTitle bold="My" italic="bookings" size="lg" component="h1" count={bookings ? bookings.length : null} />
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      <Box sx={{ mt: { xs: 3, md: 6 }, borderBottom: bookings && bookings.length > 0 ? `1px solid ${colors.text}` : 'none' }}>
        {!bookings && !error && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={104} sx={{ mb: 1.5 }} />)}
        {bookings && bookings.map((booking, index) => <BookingRow key={booking.id} booking={booking} index={index} />)}
      </Box>

      {bookings && bookings.length === 0 && (
        <Box sx={{ py: { xs: 5, md: 8 }, borderBlock: `1px solid ${colors.text}` }}>
          <Box sx={{ ...shout, fontSize: { xs: 32, md: 56 } }}>No tickets yet</Box>
          <Box sx={{ mt: 1.5, color: colors.muted }}>Your booked tickets will appear here.</Box>
          <Button component={Link} to="/" variant="contained" size="large" sx={{ mt: 3 }}>Find a movie</Button>
        </Box>
      )}
    </Container>
  );
}
