import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

import { api } from '../api';
import { colors, serif } from '../theme';
import Ticket from '../components/Ticket';
import { Eyebrow, SectionTitle } from '../components/ui';

export default function TicketPage() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const justBooked = params.get('new') === '1';
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.booking(bookingId).then(setBooking).catch((e) => setError(e.message));
  }, [bookingId]);

  if (error) {
    return <Container maxWidth="sm" sx={{ pt: 6 }}><Alert severity="error">{error}</Alert></Container>;
  }
  if (!booking) {
    return <Container maxWidth="lg" sx={{ pt: 6 }}><Skeleton variant="rounded" height={460} /></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 5 } }}>
      <Box sx={{ display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'center', gridTemplateColumns: { xs: '1fr', md: '1fr minmax(360px, 520px)' } }}>
        <Box>
          <Eyebrow color={colors.success}>{justBooked ? 'Payment received' : 'Your ticket'}</Eyebrow>
          {justBooked
            ? <SectionTitle bold="You're" italic="booked." size="lg" component="h1" sx={{ mt: 1 }} />
            : <SectionTitle bold="Your" italic="ticket." size="lg" component="h1" sx={{ mt: 1 }} />}
          <Box sx={{ fontFamily: serif, fontSize: { xs: 22, md: 28 }, lineHeight: 1.2, mt: { xs: 2, md: 3 }, maxWidth: 420 }}>
            Show this QR code at the entrance.
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 3, md: 4 }, flexWrap: 'wrap' }}>
            <Button component={Link} to="/bookings" variant="contained">All my bookings</Button>
            <Button component={Link} to="/" variant="outlined">Browse more movies</Button>
          </Box>
        </Box>

        <Box component={motion.div} initial={{ opacity: 0, y: 40, rotate: 7 }} animate={{ opacity: 1, y: 0, rotate: 1.5 }}
          whileHover={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          sx={{ order: { xs: -1, md: 0 }, mr: { xs: 1, md: 1.5 } }}>
          <Ticket booking={booking} />
        </Box>
      </Box>
    </Container>
  );
}
