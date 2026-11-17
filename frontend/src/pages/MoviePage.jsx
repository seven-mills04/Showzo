import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Box, Container, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useCity } from '../context';
import { colors, label, serif, shout } from '../theme';
import { addDays, clock, compactVotes, dayLabel, duration, rupees, todayInIndia } from '../format';
import Poster from '../components/Poster';
import { CardStack, Eyebrow, SectionTitle, Spec } from '../components/ui';

const EASE = [0.2, 0.7, 0.2, 1];

function DateStrip({ value, onChange }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(todayInIndia(), i)), []);
  return (
    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5 }} role="tablist" aria-label="Choose a date">
      {days.map((day, index) => {
        const info = dayLabel(day);
        const active = day === value;
        return (
          <Box key={day} component="button" role="tab" aria-selected={active} onClick={() => onChange(day)}
            sx={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', minWidth: { xs: 60, md: 76 }, py: 1.25, borderRadius: 1,
              textAlign: 'center', border: `1.5px solid ${colors.text}`,
              bgcolor: active ? colors.text : 'transparent', color: active ? colors.bg : colors.text,
              transform: active ? 'rotate(-3deg)' : 'none',
              transition: 'background-color .15s ease, transform .2s cubic-bezier(.2,.7,.2,1)',
              '&:hover': active ? {} : { bgcolor: colors.accent, transform: 'translateY(-3px)' },
              '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
            }}>
            <Box sx={{ ...label, fontSize: 10 }}>{index === 0 ? 'Today' : info.weekday}</Box>
            <Box sx={{ ...shout, fontSize: { xs: 26, md: 34 }, lineHeight: 1 }}>{info.day}</Box>
            <Box sx={{ ...label, fontSize: 10 }}>{info.month}</Box>
          </Box>
        );
      })}
    </Box>
  );
}

function ShowPill({ show }) {
  return (
    <Box component={Link} to={`/shows/${show.id}/seats`}
      aria-label={`${clock(show.startTime)}, ${show.language} ${show.format}, ${show.screenName}, from ${rupees(show.basePrice)}`}
      sx={{
        px: 1.75, py: 1, borderRadius: 1, border: `1.5px solid ${colors.text}`, minWidth: 112, bgcolor: colors.surface,
        transition: 'transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s cubic-bezier(.2,.7,.2,1), background-color .15s ease',
        '&:hover, &:focus-visible': { bgcolor: colors.accent, transform: 'translate(-3px, -3px)', boxShadow: `4px 4px 0 ${colors.text}`, outline: 'none' },
      }}>
      <Box sx={{ ...shout, fontSize: 19, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{clock(show.startTime)}</Box>
      <Box sx={{ ...label, fontSize: 10, color: colors.muted, mt: 0.25 }}>{show.language} · {show.format}</Box>
      <Box sx={{ ...label, fontSize: 10, mt: 0.25 }}>From {rupees(show.basePrice)}</Box>
    </Box>
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
    return <Container maxWidth="xl" sx={{ pt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }
  if (!movie) {
    return <Container maxWidth="xl" sx={{ pt: 5 }}><Skeleton variant="rounded" height={420} /></Container>;
  }

  const upcoming = movie.status === 'COMING_SOON';

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 } }}>
      {/* Title block */}
      <Box sx={{ display: 'grid', gap: { xs: 5, md: 8 }, alignItems: 'end', gridTemplateColumns: { xs: '1fr', md: '1fr minmax(220px, 330px)' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Eyebrow color={upcoming ? colors.cobalt : colors.coral}>
            {upcoming ? `Releasing ${dayLabel(movie.releaseDate).text}` : `Now showing in ${city.name}`}
          </Eyebrow>
          <Box sx={{ overflow: 'hidden', mt: 1.5, pb: '0.06em' }}>
            <Box component={motion.h1} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE }}
              sx={{ ...shout, m: 0, fontSize: 'clamp(46px, 9.6vw, 168px)', lineHeight: 0.86, textWrap: 'balance' }}>
              {movie.title}
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 3, md: 5 }, display: 'grid', gap: { xs: 3, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, alignItems: 'start' }}>
            <Box sx={{ fontFamily: serif, fontSize: { xs: 22, md: 30 }, lineHeight: 1.18, letterSpacing: '-0.01em', textWrap: 'pretty' }}>
              {movie.synopsis}
            </Box>
            <Box>
              {!upcoming && <Spec name="Rating" value={`★ ${movie.rating.toFixed(1)} / 10 · ${compactVotes(movie.votes)} votes`} />}
              <Spec name="Runtime" value={duration(movie.durationMinutes)} />
              <Spec name="Genre" value={movie.genres.join(' / ')} />
              <Spec name="Language" value={movie.languages.join(', ')} />
              <Spec name="Certificate" value={movie.certificate} />
              <Box sx={{ borderTop: `1px solid ${colors.text}` }} />
            </Box>
          </Box>
        </Box>

        <Box component={motion.div} initial={{ opacity: 0, rotate: 8, y: 30 }} animate={{ opacity: 1, rotate: 2, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          sx={{ width: { xs: '56%', sm: '38%', md: '100%' }, mx: { xs: 'auto', md: 0 }, pr: { md: 3 }, order: { xs: -1, md: 0 }, mt: { xs: 2, md: 0 } }}>
          <CardStack><Poster movie={movie} size="lg" /></CardStack>
        </Box>
      </Box>

      {/* Showtimes */}
      <Box sx={{ mt: { xs: 8, md: 14 } }}>
        {upcoming ? (
          <Box sx={{ py: { xs: 4, md: 6 }, borderBlock: `1px solid ${colors.text}` }}>
            <SectionTitle bold="Coming" italic="soon" size="md" />
            <Box sx={{ mt: 2, maxWidth: 560, color: colors.muted }}>
              Releasing on {dayLabel(movie.releaseDate).text}. Bookings open closer to the date.
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <SectionTitle bold="Show" italic="times" size="md" sx={{ columnGap: '0.02em' }} />
              <Box sx={{ ...label, pb: 1 }}>{city.name} · {dayLabel(date).text}</Box>
            </Box>
            <Box sx={{ mt: 3 }}><DateStrip value={date} onChange={setDate} /></Box>

            <Box sx={{ mt: 4, borderBottom: `1px solid ${colors.text}` }}>
              {!theatres && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={84} sx={{ mb: 1.5 }} />)}
              {theatres && theatres.length === 0 && (
                <Box sx={{ py: 6, borderTop: `1px solid ${colors.text}` }}>
                  <Box sx={{ ...shout, fontSize: { xs: 28, md: 44 } }}>No shows left this day</Box>
                  <Box sx={{ mt: 1, color: colors.muted }}>Pick another date above.</Box>
                </Box>
              )}
              {theatres && theatres.map((theatre, index) => (
                <Box key={theatre.theatreId} component={motion.div}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
                  sx={{
                    py: { xs: 2.5, md: 3 }, borderTop: `1px solid ${colors.text}`, display: 'grid', gap: { xs: 2, md: 4 }, alignItems: 'center',
                    gridTemplateColumns: { xs: '1fr', md: '32px minmax(240px, 1fr) 2fr' },
                  }}>
                  <Box sx={{ ...label, display: { xs: 'none', md: 'block' } }}>{String(index + 1).padStart(2, '0')}</Box>
                  <Box>
                    <Box sx={{ ...shout, fontSize: { xs: 22, md: 28 }, lineHeight: 1, letterSpacing: '-0.035em' }}>{theatre.theatreName}</Box>
                    <Box sx={{ ...label, color: colors.muted, mt: 0.75 }}>{theatre.address}</Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {theatre.shows.map((show) => <ShowPill key={show.id} show={show} />)}
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
