import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton, Typography } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { motion } from 'framer-motion';

import { api } from '../api';
import { colors } from '../theme';
import Ticket from '../components/Ticket';

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
    return <Container maxWidth="sm" sx={{ pt: 6 }}><Skeleton variant="rounded" height={460} sx={{ borderRadius: 4 }} /></Container>;
  }

  return (
    <Container maxWidth="sm" sx={{ pt: { xs: 3, md: 6 } }}>
      {justBooked && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <CheckCircleRounded sx={{ color: colors.success, fontSize: 36 }} />
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 30 } }}>You're booked</Typography>
            <Typography color="text.secondary">Show this QR code at the entrance.</Typography>
          </Box>
        </Box>
      )}
      <Box component={motion.div} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}>
        <Ticket booking={booking} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
        <Button component={Link} to="/bookings" variant="outlined">All my bookings</Button>
        <Button component={Link} to="/" color="inherit">Browse more movies</Button>
      </Box>
    </Container>
  );
}
