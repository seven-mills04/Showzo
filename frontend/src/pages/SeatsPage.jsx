import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton, Typography } from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useAuth } from '../context';
import { colors } from '../theme';
import { clock, dayLabel, rupees } from '../format';

const TIER_NAMES = { CLASSIC: 'Classic', PRIME: 'Prime', RECLINER: 'Recliner' };
const REFRESH_MS = 10000;

function Seat({ seat, selected, onToggle }) {
  const taken = seat.status === 'HELD' || seat.status === 'BOOKED';
  return (
    <Box component="button" type="button" disabled={taken} onClick={() => onToggle(seat.label)}
      aria-label={`Seat ${seat.label}${taken ? ', taken' : selected ? ', selected' : ''}`} aria-pressed={selected}
      sx={{
        all: 'unset', boxSizing: 'border-box', width: { xs: 19, sm: 28, md: 32 }, height: { xs: 19, sm: 28, md: 32 },
        display: 'grid', placeItems: 'center', fontSize: { xs: 8.5, sm: 11 }, fontWeight: 700,
        borderRadius: { xs: '6px 6px 4px 4px', sm: '9px 9px 5px 5px' }, cursor: taken ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${selected ? colors.accent : taken ? 'transparent' : 'rgba(255,255,255,0.28)'}`,
        bgcolor: selected ? colors.accent : taken ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: selected ? colors.accentInk : taken ? 'rgba(255,255,255,0.16)' : colors.muted,
        transition: 'transform .12s ease, background-color .12s ease, border-color .12s ease',
        '&:hover:not(:disabled)': { borderColor: colors.accent, color: selected ? colors.accentInk : colors.accent, transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: `2px solid ${colors.accent}`, outlineOffset: 2 },
      }}>
      {seat.number}
    </Box>
  );
}

function Legend() {
  const item = (label, sx) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: colors.muted }}>
      <Box sx={{ width: 16, height: 16, borderRadius: '5px 5px 3px 3px', ...sx }} />{label}
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
      {item('Available', { border: '1.5px solid rgba(255,255,255,0.28)' })}
      {item('Selected', { bgcolor: colors.accent })}
      {item('Taken', { bgcolor: 'rgba(255,255,255,0.07)' })}
    </Box>
  );
}

export default function SeatsPage() {
  const { showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [map, setMap] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback((firstLoad) => api.seatMap(showId).then((data) => {
    setMap(data);
    const all = data.rows.flatMap((row) => row.seats);
    if (firstLoad) {
      // Coming back from checkout: start with the seats this user is already holding.
      setSelected(all.filter((seat) => seat.status === 'YOURS').map((seat) => seat.label));
    } else {
      // Someone else may have taken a seat while this user was still choosing.
      const takenNow = new Set(all.filter((s) => s.status === 'HELD' || s.status === 'BOOKED').map((s) => s.label));
      setSelected((current) => {
        const kept = current.filter((label) => !takenNow.has(label));
        if (kept.length !== current.length) setNotice('A seat you picked was just taken by someone else.');
        return kept;
      });
    }
  }), [showId]);

  useEffect(() => {
    load(true).catch((e) => setError(e.message));
    const timer = setInterval(() => load(false).catch(() => {}), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const priceOf = useMemo(() => {
    const prices = {};
    (map ? map.rows : []).forEach((row) => row.seats.forEach((seat) => { prices[seat.label] = Number(row.price); }));
    return prices;
  }, [map]);

  const total = selected.reduce((sum, label) => sum + (priceOf[label] || 0), 0);

  const toggle = (label) => {
    setNotice('');
    setSelected((current) => {
      if (current.includes(label)) return current.filter((l) => l !== label);
      if (current.length >= map.maxSeats) {
        setNotice(`You can book up to ${map.maxSeats} seats at a time.`);
        return current;
      }
      return [...current, label];
    });
  };

  const proceed = async () => {
    if (!user) {
      navigate(`/sign-in?next=${encodeURIComponent(`/shows/${showId}/seats`)}`);
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      await api.holdSeats(showId, selected);
      navigate(`/shows/${showId}/checkout`);
    } catch (e) {
      setNotice(e.message);
      if (e.status === 409) load(false).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <Container maxWidth="md" sx={{ pt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }
  if (!map) {
    return <Container maxWidth="md" sx={{ pt: 5 }}><Skeleton variant="rounded" height={480} sx={{ borderRadius: 4 }} /></Container>;
  }

  // Recliners (last rows) are drawn at the top and the screen at the bottom, like a real hall plan.
  const rows = [...map.rows].reverse();

  return (
    <Box sx={{ pb: 14 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 2.5, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button component={Link} to={`/movies/${map.movieSlug}`} color="inherit" aria-label="Back to showtimes"
            sx={{ minWidth: 0, p: 1, border: `1px solid ${colors.line}` }}>
            <ArrowBackRounded />
          </Button>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" noWrap>{map.movieTitle}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {map.theatreName} · {map.screenName} · {dayLabel(map.startTime).text}, {clock(map.startTime)} · {map.language} {map.format}
            </Typography>
          </Box>
        </Box>

        {notice && <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

        <Box sx={{ mt: 4, overflowX: 'auto' }}>
          <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            sx={{ width: 'max-content', mx: 'auto', px: 1 }}>
            {rows.map((row, index) => {
              const newTier = index === 0 || rows[index - 1].tier !== row.tier;
              const half = Math.ceil(row.seats.length / 2);
              return (
                <Box key={row.row}>
                  {newTier && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: index === 0 ? 0 : 3, mb: 1.25 }}>
                      <Typography variant="overline" sx={{ color: colors.text }}>
                        {TIER_NAMES[row.tier]} <Box component="span" sx={{ color: colors.accent }}>{rupees(row.price)}</Box>
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: colors.line }} />
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '3px', sm: 0.75 }, mb: { xs: '3px', sm: 0.75 } }}>
                    <Box sx={{ width: { xs: 14, sm: 18 }, fontSize: 12, fontWeight: 700, color: colors.muted }}>{row.row}</Box>
                    {row.seats.map((seat, i) => (
                      <Box key={seat.label} sx={{ ml: i === half ? { xs: 1.5, sm: 4 } : 0 }}>
                        <Seat seat={seat} selected={selected.includes(seat.label)} onToggle={toggle} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}

            <Box sx={{ mt: 5, mb: 1, mx: 'auto', width: '82%' }}>
              <Box sx={{
                height: 46, borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                borderBottom: `3px solid ${colors.accent}`,
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,197,49,0.16) 100%)',
              }} />
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                Screen this way
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}><Legend /></Box>
      </Container>

      <Box sx={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 15, borderTop: `1px solid ${colors.line}`,
        bgcolor: 'rgba(22,22,27,0.94)', backdropFilter: 'blur(14px)',
      }}>
        <Container maxWidth="lg" sx={{ py: 1.75, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {selected.length === 0 ? (
              <Typography color="text.secondary">Tap seats to select them</Typography>
            ) : (
              <>
                <Typography fontWeight={700} noWrap>
                  {selected.length} {selected.length === 1 ? 'seat' : 'seats'} · {[...selected].sort().join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">{rupees(total)} + fees</Typography>
              </>
            )}
          </Box>
          <Button variant="contained" size="large" disabled={selected.length === 0 || busy} onClick={proceed}>
            {busy ? 'Holding seats…' : user ? 'Continue' : 'Sign in to continue'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
