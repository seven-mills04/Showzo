import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Box, Chip, Container, Skeleton, Tooltip, Typography } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';

import { api } from '../api';
import { useCity } from '../context';
import { colors, display } from '../theme';
import { addDays, clock, compactVotes, dayLabel, duration, rupees, todayInIndia } from '../format';
import Poster from '../components/Poster';

function DateStrip({ value, onChange }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(todayInIndia(), i)), []);
  return (
    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }} role="tablist" aria-label="Choose a date">
      {days.map((day, index) => {
        const label = dayLabel(day);
        const active = day === value;
        return (
          <Box key={day} component="button" role="tab" aria-selected={active} onClick={() => onChange(day)}
            sx={{
              all: 'unset', cursor: 'pointer', minWidth: 62, py: 1, borderRadius: 2, textAlign: 'center',
              border: `1px solid ${colors.text}`,
              bgcolor: active ? colors.text : 'transparent', color: active ? colors.bg : colors.text,
              transition: 'all .15s ease', '&:hover': active ? {} : { bgcolor: colors.accent },
              '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
            }}>
            <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.75 }}>
              {index === 0 ? 'TODAY' : label.weekday.toUpperCase()}
            </Box>
            <Box sx={{ fontFamily: display, fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>{label.day}</Box>
            <Box sx={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>{label.month}</Box>
          </Box>
        );
      })}
    </Box>
  );
}

function ShowPill({ show }) {
  return (
    <Tooltip title={`${show.screenName} · from ${rupees(show.basePrice)}`} arrow>
      <Box component={Link} to={`/shows/${show.id}/seats`}
        sx={{
          px: 2, py: 1, borderRadius: 2, border: `1px solid ${colors.text}`, textAlign: 'center', minWidth: 104,
          transition: 'all .15s ease',
          '&:hover, &:focus-visible': { bgcolor: colors.accent },
        }}>
        <Box sx={{ fontWeight: 800 }}>{clock(show.startTime)}</Box>
        <Box sx={{ fontSize: 11.5, color: colors.muted, fontWeight: 600 }}>{show.language} · {show.format}</Box>
      </Box>
    </Tooltip>
  );
}

export default function MoviePage() {
  const { slug } = useParams();
  const { city } = useCity();
  const [movie, setMovie] = useState(null);
  const [theatres, setTheatres] = useState(null);
  const [date, setDate] = useState(todayInIndia());
  const [error, setError] = useState('');

  useEffect(() => {
    setMovie(null);
    setError('');
    api.movie(slug).then(setMovie).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    setTheatres(null);
    api.shows(slug, city.slug, date).then(setTheatres).catch(() => setTheatres([]));
  }, [slug, city.slug, date]);

  if (error) {
    return <Container maxWidth="lg" sx={{ pt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }
  if (!movie) {
    return <Container maxWidth="lg" sx={{ pt: 5 }}><Skeleton variant="rounded" height={340} sx={{ borderRadius: 4 }} /></Container>;
  }

  const upcoming = movie.status === 'COMING_SOON';

  return (
    <>
      <Box sx={{
        borderBottom: `1px solid ${colors.line}`,
        background: `radial-gradient(90% 160% at 12% 0%, color-mix(in srgb, ${movie.accentColor} 55%, transparent) 0%, transparent 62%)`,
      }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, display: 'flex', gap: { xs: 2.5, md: 5 }, alignItems: 'flex-end' }}>
          <Box sx={{ width: { xs: 120, sm: 180, md: 220 }, flexShrink: 0 }}><Poster movie={movie} size="lg" /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 56 }, textWrap: 'balance' }}>{movie.title}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 2 }}>
              {!upcoming && (
                <Chip icon={<StarRounded sx={{ color: `${colors.text} !important` }} />}
                  label={`${movie.rating.toFixed(1)} · ${compactVotes(movie.votes)} votes`} />
              )}
              <Chip icon={<AccessTimeRounded />} label={duration(movie.durationMinutes)} variant="outlined" />
              <Chip label={movie.certificate} variant="outlined" />
              {movie.genres.map((g) => <Chip key={g} label={g} variant="outlined" />)}
            </Box>
            <Typography sx={{ mt: 2.5, maxWidth: 640, color: colors.muted, fontSize: { xs: 15, md: 17 } }}>
              {movie.synopsis}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600 }}>
              {movie.languages.join(' · ')}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 } }}>
        {upcoming ? (
          <Alert severity="info" variant="outlined">
            Releasing on {dayLabel(movie.releaseDate).text}. Bookings open closer to the date.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              <Typography variant="h4">Showtimes in {city.name}</Typography>
              <Typography color="text.secondary">{dayLabel(date).text}</Typography>
            </Box>
            <DateStrip value={date} onChange={setDate} />

            <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
              {!theatres && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
              {theatres && theatres.length === 0 && (
                <Box sx={{ py: 6, textAlign: 'center', border: `1px dashed ${colors.line}`, borderRadius: 3 }}>
                  <Typography variant="h6">No shows left on this day</Typography>
                  <Typography color="text.secondary">Pick another date above.</Typography>
                </Box>
              )}
              {theatres && theatres.map((theatre) => (
                <Box key={theatre.theatreId}
                  sx={{
                    p: { xs: 2, md: 2.5 }, borderRadius: 3, bgcolor: colors.surface, border: `1px solid ${colors.line}`,
                    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' },
                  }}>
                  <Box sx={{ width: { md: 300 }, flexShrink: 0 }}>
                    <Typography fontWeight={700}>{theatre.theatreName}</Typography>
                    <Typography variant="body2" color="text.secondary">{theatre.address}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {theatre.shows.map((show) => <ShowPill key={show.id} show={show} />)}
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Container>
    </>
  );
}
