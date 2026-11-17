import { Box } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

import { colors, label, shout } from '../theme';
import { clock, dayLabel, rupees } from '../format';

function Field({ name, value, sub }) {
  return (
    <Box sx={{ borderTop: `1px solid ${colors.text}`, pt: 0.9 }}>
      <Box sx={{ ...label, color: colors.muted }}>{name}</Box>
      <Box sx={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2, mt: 0.25 }}>{value}</Box>
      {sub && <Box sx={{ fontSize: 13, color: colors.muted, mt: 0.25 }}>{sub}</Box>}
    </Box>
  );
}

// The two half-circle cut-outs that make the card look like a torn ticket stub.
const notch = (side) => ({
  content: '""', position: 'absolute', top: -14, [side]: -15, width: 26, height: 26, borderRadius: '50%',
  bgcolor: colors.bg, border: `1.5px solid ${colors.text}`,
});

export default function Ticket({ booking }) {
  const date = dayLabel(booking.startTime);
  return (
    <Box sx={{ position: 'relative', borderRadius: 1.5, bgcolor: colors.surface, border: `1.5px solid ${colors.text}`, boxShadow: `9px 9px 0 ${colors.text}` }}>
      <Box sx={{
        p: { xs: 2.5, md: 3.5 }, color: '#fff', borderRadius: '8px 8px 0 0', borderBottom: `1.5px solid ${colors.text}`,
        background: `linear-gradient(150deg, color-mix(in srgb, ${booking.accentColor} 80%, #fff) 0%, ${booking.accentColor} 45%, color-mix(in srgb, ${booking.accentColor} 40%, #000) 100%)`,
      }}>
        <Box sx={{ ...label, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <span>{booking.language} · {booking.format} · {booking.certificate}</span>
          <span>Admit {booking.seats.length}</span>
        </Box>
        <Box sx={{ ...shout, fontSize: 'clamp(34px, 6vw, 60px)', lineHeight: 0.9, mt: 1.5, textWrap: 'balance' }}>
          {booking.movieTitle}
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 3.5 }, display: 'grid', columnGap: 3, rowGap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' } }}>
        <Field name="Date" value={date.text} />
        <Field name="Time" value={clock(booking.startTime)} />
        <Field name="Screen" value={booking.screenName} />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Field name="Theatre" value={booking.theatreName} sub={booking.theatreAddress} />
        </Box>
      </Box>

      <Box sx={{
        position: 'relative', borderTop: `2px dashed ${colors.text}`, overflow: 'visible',
        '&::before': notch('left'), '&::after': notch('right'),
        p: { xs: 2.5, md: 3.5 }, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'space-between',
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ ...label, color: colors.muted }}>Seats</Box>
          <Box sx={{ ...shout, fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1, mt: 0.5 }}>{booking.seats.join('  ')}</Box>
          <Box sx={{ ...label, mt: 2 }}>
            Booking ID <Box component="span" sx={{ bgcolor: colors.accent, px: 0.75, py: 0.25, borderRadius: 0.5 }}>{booking.bookingRef}</Box>
          </Box>
          <Box sx={{ ...label, color: colors.muted, mt: 0.75 }}>Paid {rupees(booking.totalAmount)}</Box>
        </Box>
        <Box sx={{ p: 1, bgcolor: '#fff', border: `1.5px solid ${colors.text}`, borderRadius: 1, flexShrink: 0, lineHeight: 0 }}>
          <QRCodeSVG value={`SHOWZO:${booking.bookingRef}`} size={112} level="M"
            title={`QR code for booking ${booking.bookingRef}`} />
        </Box>
      </Box>
    </Box>
  );
}
