import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

import { colors, display } from '../theme';
import { clock, dayLabel, rupees } from '../format';

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>{label}</Typography>
      <Typography fontWeight={700} sx={{ lineHeight: 1.25 }}>{value}</Typography>
    </Box>
  );
}

// The two half-circle cut-outs that make the card look like a torn ticket stub.
const notch = (side) => ({
  content: '""', position: 'absolute', top: -13, [side]: -13, width: 26, height: 26,
  borderRadius: '50%', bgcolor: colors.bg,
});

export default function Ticket({ booking }) {
  const date = dayLabel(booking.startTime);
  return (
    <Box sx={{
      borderRadius: 4, overflow: 'hidden', bgcolor: colors.surface, border: `1px solid ${colors.line}`,
      boxShadow: '0 30px 60px -30px rgba(0,0,0,0.9)',
    }}>
      <Box sx={{
        p: { xs: 2.5, md: 3.5 },
        background: `linear-gradient(150deg, color-mix(in srgb, ${booking.accentColor} 85%, #fff) 0%, ${booking.accentColor} 45%, color-mix(in srgb, ${booking.accentColor} 40%, #000) 100%)`,
        color: '#fff',
      }}>
        <Typography variant="overline" sx={{ opacity: 0.85 }}>
          {booking.language} · {booking.format} · {booking.certificate}
        </Typography>
        <Typography sx={{ fontFamily: display, fontWeight: 800, fontSize: { xs: 30, md: 40 }, lineHeight: 1.02, letterSpacing: '-0.03em', mt: 0.5, textWrap: 'balance' }}>
          {booking.movieTitle}
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 3.5 }, display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' } }}>
        <Field label="Date" value={date.text} />
        <Field label="Time" value={clock(booking.startTime)} />
        <Field label="Screen" value={booking.screenName} />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Field label="Theatre" value={booking.theatreName} />
          <Typography variant="body2" color="text.secondary">{booking.theatreAddress}</Typography>
        </Box>
      </Box>

      <Box sx={{
        position: 'relative', borderTop: `2px dashed ${colors.line}`,
        '&::before': notch('left'), '&::after': notch('right'),
        p: { xs: 2.5, md: 3.5 }, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'space-between',
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary">Seats</Typography>
          <Typography sx={{ fontFamily: display, fontWeight: 800, fontSize: { xs: 26, md: 34 }, lineHeight: 1.1, color: colors.accent }}>
            {booking.seats.join('  ')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Booking ID <Box component="span" sx={{ color: colors.text, fontWeight: 700, letterSpacing: '0.06em' }}>{booking.bookingRef}</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">Paid {rupees(booking.totalAmount)}</Typography>
        </Box>
        <Box sx={{ p: 1.25, bgcolor: '#fff', borderRadius: 2, flexShrink: 0, lineHeight: 0 }}>
          <QRCodeSVG value={`SHOWZO:${booking.bookingRef}`} size={112} level="M"
            title={`QR code for booking ${booking.bookingRef}`} />
        </Box>
      </Box>
    </Box>
  );
}
