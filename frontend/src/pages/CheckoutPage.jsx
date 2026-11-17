import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Skeleton, Typography,
} from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';

import { api } from '../api';
import { useAuth } from '../context';
import { colors, display } from '../theme';
import { clock, dayLabel, rupees } from '../format';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

// Loads Razorpay's checkout script once, only when it is actually needed.
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(script);
  });
}

// Seconds left until the seat hold lapses, updated every second.
function useCountdown(expiresAt) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return left;
}

function Row({ label, value, strong }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
      <Typography color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 700 : 400}>{label}</Typography>
      <Typography fontWeight={strong ? 800 : 600} sx={strong ? { fontFamily: display, fontSize: 22 } : undefined}>{value}</Typography>
    </Box>
  );
}

export default function CheckoutPage() {
  const { showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // React runs effects twice in development; the ref makes sure only one order is created.
    if (started.current) return;
    started.current = true;
    Promise.all([api.seatMap(showId), api.checkout(showId)])
      .then(([seatMap, checkout]) => { setShow(seatMap); setOrder(checkout); })
      .catch((e) => setError(e.message));
  }, [showId]);

  const secondsLeft = useCountdown(order && order.holdExpiresAt);
  const expired = secondsLeft === 0;

  const finish = async (payment) => {
    try {
      const booking = await api.confirm(order.bookingId, payment);
      if (booking.status === 'CONFIRMED') {
        navigate(`/bookings/${booking.id}?new=1`, { replace: true });
      } else {
        setError('Your seats were released before the payment finished, so nothing was booked. Please choose seats again.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
      setDemoOpen(false);
    }
  };

  const pay = async () => {
    setError('');
    if (order.gateway === 'DEMO') {
      setDemoOpen(true);
      return;
    }
    setPaying(true);
    try {
      await loadRazorpay();
      const popup = new window.Razorpay({
        key: order.gatewayKey,
        order_id: order.orderId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'Showzo',
        description: `${show.movieTitle} · ${order.seats.join(', ')}`,
        prefill: { name: user.name, email: user.email },
        theme: { color: colors.accent },
        handler: (result) => finish({
          orderId: result.razorpay_order_id,
          paymentId: result.razorpay_payment_id,
          signature: result.razorpay_signature,
        }),
        modal: { ondismiss: () => setPaying(false) },
      });
      popup.open();
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  };

  const payDemo = () => {
    setPaying(true);
    finish({ orderId: order.orderId, paymentId: `demo_pay_${Date.now()}` });
  };

  if (error && !order) {
    return (
      <Container maxWidth="sm" sx={{ pt: 6, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ textAlign: 'left' }}>{error}</Alert>
        <Button component={Link} to={`/shows/${showId}/seats`} variant="contained" sx={{ mt: 3 }}>Choose seats</Button>
      </Container>
    );
  }
  if (!order || !show) {
    return <Container maxWidth="sm" sx={{ pt: 6 }}><Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} /></Container>;
  }

  const minutes = Math.floor((secondsLeft || 0) / 60);
  const seconds = String((secondsLeft || 0) % 60).padStart(2, '0');

  return (
    <Container maxWidth="sm" sx={{ pt: { xs: 3, md: 6 } }}>
      <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>Review and pay</Typography>

      <Box sx={{
        mt: 2, px: 2, py: 1.25, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: expired ? 'rgba(255,107,87,0.12)' : 'rgba(255,197,49,0.1)',
        color: expired ? colors.danger : colors.accent, fontWeight: 700,
      }} role="status">
        <TimerOutlined fontSize="small" />
        {expired ? 'Your seat hold has ended.' : `Seats held for ${minutes}:${seconds}`}
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Box sx={{ mt: 2.5, p: { xs: 2.5, md: 3 }, borderRadius: 3, bgcolor: colors.surface, border: `1px solid ${colors.line}` }}>
        <Typography variant="h5">{show.movieTitle}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {dayLabel(show.startTime).text}, {clock(show.startTime)} · {show.language} {show.format}
        </Typography>
        <Typography color="text.secondary">{show.theatreName} · {show.screenName}</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
          {order.seats.map((seat) => (
            <Box key={seat} sx={{
              px: 1.25, py: 0.4, borderRadius: 1.5, fontWeight: 800, fontSize: 14,
              bgcolor: colors.accent, color: colors.accentInk,
            }}>{seat}</Box>
          ))}
        </Box>

        <Divider sx={{ my: 2.5 }} />
        <Row label={`Tickets (${order.seats.length})`} value={rupees(order.ticketAmount)} />
        <Row label="Convenience fee" value={rupees(order.convenienceFee)} />
        <Divider sx={{ my: 1.5 }} />
        <Row label="Total" value={rupees(order.totalAmount)} strong />
      </Box>

      {expired ? (
        <Button component={Link} to={`/shows/${showId}/seats`} variant="contained" size="large" fullWidth sx={{ mt: 3 }}>
          Choose seats again
        </Button>
      ) : (
        <Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} startIcon={<LockOutlined />}
          disabled={paying} onClick={pay}>
          {paying ? 'Waiting for payment…' : `Pay ${rupees(order.totalAmount)}`}
        </Button>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
        {order.gateway === 'DEMO'
          ? 'Demo mode: no payment provider is connected, so no money is charged.'
          : 'Payments run in Razorpay test mode. No real money is charged.'}
      </Typography>

      <Dialog open={demoOpen} onClose={() => !paying && setDemoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: display, fontWeight: 800 }}>Demo payment</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This is a practice step, not a real payment. No card or UPI details are asked for and nothing is charged.
          </Typography>
          <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: colors.raised }}>
            <Row label="Amount" value={rupees(order.totalAmount)} strong />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" disabled={paying} onClick={() => setDemoOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={paying} onClick={payDemo}>
            {paying ? 'Confirming…' : 'Complete demo payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
