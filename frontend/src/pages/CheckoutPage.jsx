import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Dialog, Skeleton } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useAuth } from '../context';
import { colors, label, shout } from '../theme';
import { clock, dayLabel, rupees } from '../format';
import { Eyebrow, SectionTitle, Spec, panel } from '../components/ui';

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
        theme: { color: colors.text },
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
      <Container maxWidth="sm" sx={{ pt: 6 }}>
        <SectionTitle bold="Seats" italic="released" size="md" component="h1" />
        <Alert severity="warning" sx={{ mt: 3 }}>{error}</Alert>
        <Button component={Link} to={`/shows/${showId}/seats`} variant="contained" size="large" sx={{ mt: 3 }}>Choose seats</Button>
      </Container>
    );
  }
  if (!order || !show) {
    return <Container maxWidth="lg" sx={{ pt: 6 }}><Skeleton variant="rounded" height={420} /></Container>;
  }

  const minutes = Math.floor((secondsLeft || 0) / 60);
  const seconds = String((secondsLeft || 0) % 60).padStart(2, '0');

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 5 } }}>
      <Box sx={{ display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'start', gridTemplateColumns: { xs: '1fr', md: '1fr minmax(340px, 440px)' } }}>
        {/* Left: what is being bought, and the clock */}
        <Box sx={{ minWidth: 0 }}>
          <Eyebrow>Step 2 of 2</Eyebrow>
          <SectionTitle bold="Review" italic="& pay" size="lg" component="h1" sx={{ mt: 1 }} />

          <Box role="status" sx={{
            mt: { xs: 3, md: 5 }, display: 'inline-flex', alignItems: 'baseline', gap: 1.5, px: 2, py: 1.25,
            border: `1.5px solid ${colors.text}`, borderRadius: 1, transform: 'rotate(-1.5deg)',
            bgcolor: expired ? colors.coral : colors.accent, color: colors.accentInk,
          }}>
            <Box sx={{ ...label }}>{expired ? 'Your seat hold has ended' : 'Seats held for'}</Box>
            {!expired && <Box sx={{ ...shout, fontSize: { xs: 34, md: 46 }, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{minutes}:{seconds}</Box>}
          </Box>

          <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Box sx={{ ...shout, fontSize: 'clamp(30px, 4.4vw, 64px)', textWrap: 'balance', mb: 2.5 }}>{show.movieTitle}</Box>
            <Spec name="When" value={`${dayLabel(show.startTime).text} · ${clock(show.startTime)}`} />
            <Spec name="Where" value={`${show.theatreName} · ${show.screenName}`} />
            <Spec name="Format" value={`${show.language} · ${show.format}`} />
            <Box sx={{ borderTop: `1px solid ${colors.text}` }} />
          </Box>
        </Box>

        {/* Right: the bill */}
        <Box component={motion.div} initial={{ opacity: 0, y: 24, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          sx={{ ...panel, p: { xs: 2.5, md: 3.5 }, position: { md: 'sticky' }, top: { md: 84 } }}>
          <Box sx={{ ...label, color: colors.muted }}>Your seats</Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1, mb: 3 }}>
            {order.seats.map((seat) => (
              <Box key={seat} sx={{
                ...shout, fontSize: 22, lineHeight: 1, letterSpacing: '-0.03em', px: 1, py: 0.6, borderRadius: 0.75,
                bgcolor: colors.accent, border: `1.5px solid ${colors.text}`,
              }}>{seat}</Box>
            ))}
          </Box>

          <Spec name={`Tickets × ${order.seats.length}`} value={rupees(order.ticketAmount)} />
          <Spec name="Convenience fee" value={rupees(order.convenienceFee)} />
          <Spec name="Total" value={rupees(order.totalAmount)} strong />
          <Box sx={{ borderTop: `1px solid ${colors.text}` }} />

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

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
          <Box sx={{ mt: 1.5, fontSize: 13, color: colors.muted, textAlign: 'center' }}>
            {order.gateway === 'DEMO'
              ? 'Demo mode: no payment provider is connected, so no money is charged.'
              : 'Payments run in Razorpay test mode. No real money is charged.'}
          </Box>
        </Box>
      </Box>

      <Dialog open={demoOpen} onClose={() => !paying && setDemoOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { ...panel, p: { xs: 2.5, md: 3.5 } } }} aria-labelledby="demo-pay-title">
        <Box id="demo-pay-title" sx={{ ...shout, fontSize: 34 }}>Demo payment</Box>
        <Box sx={{ mt: 1.5, color: colors.muted }}>
          This is a practice step, not a real payment. No card or UPI details are asked for and nothing is charged.
        </Box>
        <Box sx={{ mt: 3 }}>
          <Spec name="Amount" value={rupees(order.totalAmount)} strong />
          <Box sx={{ borderTop: `1px solid ${colors.text}` }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" disabled={paying} onClick={() => setDemoOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={paying} onClick={payDemo}>
            {paying ? 'Confirming…' : 'Complete demo payment'}
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
}
