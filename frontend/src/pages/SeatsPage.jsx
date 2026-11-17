import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton } from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useAuth } from '../context';
import { colors, label, shout } from '../theme';
import { Eyebrow, Spec } from '../components/ui';
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
        border: `1.5px solid ${taken ? 'transparent' : selected ? colors.text : 'rgba(11,11,11,0.45)'}`,
        bgcolor: selected ? colors.accent : taken ? 'rgba(11,11,11,0.1)' : 'transparent',
        color: selected ? colors.accentInk : taken ? 'rgba(11,11,11,0.22)' : colors.text,
        transition: 'transform .12s ease, background-color .12s ease, border-color .12s ease',
        '&:hover:not(:disabled)': { borderColor: colors.text, bgcolor: colors.accent, transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
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
      {item('Available', { border: '1.5px solid rgba(11,11,11,0.45)' })}
      {item('Selected', { bgcolor: colors.accent, border: `1.5px solid ${colors.text}` })}
      {item('Taken', { bgcolor: 'rgba(11,11,11,0.1)' })}
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
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 } }}>
        <Box component={Link} to={`/movies/${map.movieSlug}`}
          sx={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 0.75, borderBottom: `1.5px solid ${colors.text}`, pb: 0.25, '&:hover': { bgcolor: colors.accent } }}>
          <ArrowBackRounded sx={{ fontSize: 14 }} /> All showtimes
        </Box>
        <Box sx={{ mt: 2, display: 'grid', gap: { xs: 2, md: 6 }, alignItems: 'end', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' } }}>
          <Box sx={{ minWidth: 0 }}>
            <Eyebrow>Choose your seats</Eyebrow>
            <Box component="h1" sx={{ ...shout, m: 0, mt: 1, fontSize: 'clamp(36px, 6.4vw, 104px)', lineHeight: 0.88, textWrap: 'balance' }}>
              {map.movieTitle}
            </Box>
          </Box>
          <Box>
            <Spec name="When" value={`${dayLabel(map.startTime).text} · ${clock(map.startTime)}`} />
            <Spec name="Where" value={`${map.theatreName} · ${map.screenName}`} />
            <Spec name="Format" value={`${map.language} · ${map.format}`} />
            <Box sx={{ borderTop: `1px solid ${colors.text}` }} />
          </Box>
        </Box>

        {notice && <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

        <Box sx={{ mt: { xs: 5, md: 8 }, overflowX: 'auto' }}>
          <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            sx={{ width: 'max-content', mx: 'auto', px: 1 }}>
            {rows.map((row, index) => {
              const newTier = index === 0 || rows[index - 1].tier !== row.tier;
              const half = Math.ceil(row.seats.length / 2);
              return (
                <Box key={row.row}>
                  {newTier && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: index === 0 ? 0 : 3, mb: 1.25 }}>
                      <Box sx={{ ...shout, fontSize: 18, lineHeight: 1, letterSpacing: '-0.03em' }}>{TIER_NAMES[row.tier]}</Box>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: colors.text }} />
                      <Box sx={{ ...label }}>{rupees(row.price)}</Box>
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
                borderBottom: `3px solid ${colors.text}`,
                background: 'linear-gradient(180deg, transparent 0%, rgba(200,255,46,0.55) 100%)',
              }} />
              <Box sx={{ ...label, textAlign: 'center', mt: 1.5 }}>Screen this way</Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}><Legend /></Box>
      </Container>

      <Box sx={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 15, borderTop: `1.5px solid ${colors.text}`,
        bgcolor: 'rgba(241,239,232,0.94)', backdropFilter: 'blur(14px)',
      }}>
        <Container maxWidth="xl" sx={{ py: 1.75, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {selected.length === 0 ? (
              <Box sx={{ ...label, color: colors.muted }}>Tap seats to select them</Box>
            ) : (
              <>
                <Box sx={{ ...shout, fontSize: { xs: 22, md: 30 }, lineHeight: 1, letterSpacing: '-0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[...selected].sort().join('  ')}
                </Box>
                <Box sx={{ ...label, mt: 0.5 }}>
                  {selected.length} {selected.length === 1 ? 'seat' : 'seats'} · {rupees(total)} + fees
                </Box>
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
