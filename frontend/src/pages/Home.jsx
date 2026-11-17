import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, Skeleton } from '@mui/material';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { api } from '../api';
import { useCity } from '../context';
import { colors, label, serif, shout } from '../theme';
import { compactVotes, dayLabel } from '../format';
import MovieCard from '../components/MovieCard';
import Poster from '../components/Poster';
import { CardStack, Eyebrow, SectionTitle, Spec } from '../components/ui';

const EASE = [0.2, 0.7, 0.2, 1];
const SLIDE_MS = 5000;

/* ---------- Headline: each line rises into place ---------- */

function Rise({ children, delay = 0, sx }) {
  return (
    <Box sx={{ overflow: 'hidden', pb: '0.08em', mb: '-0.08em', ...sx }}>
      <Box component={motion.div} initial={{ y: '105%' }} animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: EASE }}>
        {children}
      </Box>
    </Box>
  );
}

function Headline() {
  return (
    <Box component="h1" sx={{ ...shout, m: 0, fontSize: 'clamp(54px, 13.2vw, 232px)', lineHeight: 0.84 }}>
      <Rise>Lights.</Rise>
      <Rise delay={0.08} sx={{ pl: { xs: '8%', md: '18%' } }}>Camera.</Rise>
      <Rise delay={0.16} sx={{ textAlign: 'right' }}>
        <Box component="span" sx={{
          fontFamily: serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: '-0.03em',
          display: 'inline-block', px: '0.12em', bgcolor: colors.accent, borderRadius: '0.08em', transform: 'rotate(-2deg)',
        }}>
          book it.
        </Box>
      </Rise>
    </Box>
  );
}

/* ---------- Featured film: numbered slides with a spec sheet ---------- */

function Featured({ movies, cityName }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const movie = movies[index % movies.length];

  useEffect(() => {
    if (paused || reduceMotion || movies.length < 2) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % movies.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, reduceMotion, movies.length]);

  return (
    <Box onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      sx={{
        mt: { xs: 5, md: 8 }, display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'end',
        gridTemplateColumns: { xs: '1fr', md: '1fr minmax(240px, 360px) 1fr' },
      }}>
      {/* Left: the film's details */}
      <Box sx={{ order: { xs: 2, md: 1 } }}>
        <Eyebrow sx={{ mb: 2 }}>Top rated in {cityName} this week</Eyebrow>
        <AnimatePresence mode="wait">
          <Box key={movie.slug} component={motion.div} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3, ease: EASE }}>
            <Box sx={{ ...shout, fontSize: 'clamp(34px, 4.6vw, 72px)', textWrap: 'balance' }}>{movie.title}</Box>
            <Box sx={{ mt: 3 }}>
              <Spec name="Rating" value={`★ ${movie.rating.toFixed(1)} / 10 · ${compactVotes(movie.votes)} votes`} />
              <Spec name="Genre" value={movie.genres.join(' / ')} />
              <Spec name="Language" value={movie.languages.join(', ')} />
              <Spec name="Certificate" value={movie.certificate} />
              <Box sx={{ borderTop: `1px solid ${colors.text}` }} />
            </Box>
          </Box>
        </AnimatePresence>
        <Button component={Link} to={`/movies/${movie.slug}`} variant="contained" size="large"
          endIcon={<ArrowForwardRounded />} sx={{ mt: 3 }}>
          Book tickets
        </Button>
      </Box>

      {/* Middle: the poster on a stack of coloured cards */}
      <Box sx={{ order: { xs: 1, md: 2 }, mx: { xs: 'auto', md: 0 }, width: { xs: '62%', sm: '44%', md: '100%' } }}>
        <CardStack>
          <AnimatePresence mode="wait">
            <Box key={movie.slug} component={motion.div}
              initial={{ opacity: 0, rotate: 6, y: 30 }} animate={{ opacity: 1, rotate: 1.5, y: 0 }}
              exit={{ opacity: 0, rotate: -6, y: -20 }} transition={{ duration: 0.45, ease: EASE }}>
              <Link to={`/movies/${movie.slug}`} aria-label={`Book ${movie.title}`}><Poster movie={movie} size="lg" /></Link>
            </Box>
          </AnimatePresence>
        </CardStack>
      </Box>

      {/* Right: slide numbers */}
      <Box sx={{ order: 3, display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: { xs: 2, md: 0 }, justifySelf: { md: 'end' }, width: { md: 220 } }}>
        {movies.map((m, i) => {
          const active = i === index;
          return (
            <Box key={m.slug} component="button" type="button" onClick={() => setIndex(i)} aria-current={active}
              sx={{
                all: 'unset', cursor: 'pointer', flex: { xs: 1, md: 'none' }, py: 1.25, position: 'relative',
                borderTop: `1px solid ${colors.text}`, opacity: active ? 1 : 0.5, transition: 'opacity .2s ease',
                '&:hover': { opacity: 1 }, '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
              }}>
              <Box sx={{ ...label }}>{String(i + 1).padStart(2, '0')}</Box>
              <Box sx={{ ...label, display: { xs: 'none', md: 'block' }, color: colors.muted, mt: 0.25 }}>{m.title}</Box>
              {active && !paused && !reduceMotion && (
                <Box component={motion.div} key={`${index}-bar`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                  sx={{ position: 'absolute', top: -2, left: 0, right: 0, height: 3, bgcolor: colors.text, transformOrigin: 'left' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ---------- Scrolling band ---------- */

function Marquee({ items }) {
  const run = (key) => (
    <Box key={key} sx={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
      {items.map((text) => (
        <Box key={text} sx={{ ...shout, fontSize: { xs: 22, md: 34 }, lineHeight: 1, pl: { xs: 4, md: 6 }, display: 'flex', alignItems: 'center', gap: { xs: 4, md: 6 }, whiteSpace: 'nowrap' }}>
          {text}<Box component="span" sx={{ fontSize: '0.7em' }}>✦</Box>
        </Box>
      ))}
    </Box>
  );
  return (
    <Box sx={{ overflow: 'hidden', mt: { xs: 7, md: 12 }, py: 2 }}>
      <Box aria-hidden sx={{
        py: { xs: 1.5, md: 2 }, display: 'flex', mx: '-2%',
        bgcolor: colors.accent, borderBlock: `1.5px solid ${colors.text}`, transform: 'rotate(-1.2deg)',
        '@keyframes showzo-slide': { to: { transform: 'translateX(-100%)' } },
        '& > *': { animation: 'showzo-slide 26s linear infinite' },
        '@media (prefers-reduced-motion: reduce)': { '& > *': { animation: 'none' } },
      }}>
        {[0, 1, 2].map(run)}
      </Box>
    </Box>
  );
}

function FilterRow({ name, options, value, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
      <Box sx={{ ...label, color: colors.muted, width: 78 }}>{name}</Box>
      {options.map((option) => {
        const active = option === value;
        return (
          <Box key={option} component="button" type="button" aria-pressed={active} onClick={() => onChange(active ? '' : option)}
            sx={{
              all: 'unset', ...label, cursor: 'pointer', px: 1.25, height: 26, display: 'inline-flex', alignItems: 'center',
              borderRadius: 999, border: `1.5px solid ${colors.text}`,
              bgcolor: active ? colors.text : 'transparent', color: active ? colors.bg : colors.text,
              transition: 'background-color .15s ease, color .15s ease',
              '&:hover': active ? {} : { bgcolor: colors.accent },
              '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
            }}>
            {option}
          </Box>
        );
      })}
    </Box>
  );
}

/* ---------- Coming soon: one big line per film ---------- */

function UpcomingRow({ movie, index }) {
  const date = dayLabel(movie.releaseDate);
  return (
    <Box component={Link} to={`/movies/${movie.slug}`}
      sx={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 4 }, py: { xs: 2, md: 2.5 }, px: { xs: 0, md: 1 },
        borderTop: `1px solid ${colors.text}`, transition: 'background-color .18s ease, padding .25s cubic-bezier(.2,.7,.2,1)',
        '& .thumb': { opacity: 0, transform: 'translateY(-50%) rotate(0deg) scale(0.8)', transition: 'all .25s cubic-bezier(.2,.7,.2,1)' },
        '&:hover, &:focus-visible': { bgcolor: colors.accent, px: { md: 3 }, outline: 'none' },
        '&:hover .thumb, &:focus-visible .thumb': { opacity: 1, transform: 'translateY(-50%) rotate(7deg) scale(1)' },
      }}>
      <Box sx={{ ...label, width: 24 }}>{String(index + 1).padStart(2, '0')}</Box>
      <Box sx={{ ...shout, flex: 1, minWidth: 0, fontSize: 'clamp(26px, 5.4vw, 84px)' }}>{movie.title}</Box>
      <Box sx={{ ...label, textAlign: 'right', flexShrink: 0 }}>
        <div>{date.day} {date.month}</div>
        <Box sx={{ color: colors.muted, display: { xs: 'none', sm: 'block' } }}>{movie.genres.join(' / ')}</Box>
      </Box>
      <Box className="thumb" aria-hidden sx={{ position: 'absolute', right: '22%', top: '50%', width: 120, zIndex: 2, pointerEvents: 'none', display: { xs: 'none', md: 'block' } }}>
        <Poster movie={movie} size="sm" />
      </Box>
    </Box>
  );
}

/* ---------- Page ---------- */

const grid = {
  display: 'grid', columnGap: { xs: 2, md: 3 }, rowGap: { xs: 4, md: 6 },
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
};

export default function Home() {
  const { city } = useCity();
  const [params] = useSearchParams();
  const search = params.get('q') || '';

  const [movies, setMovies] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    setMovies(null);
    setError('');
    api.movies(city.slug).then(setMovies).catch((e) => setError(e.message));
  }, [city.slug]);

  useEffect(() => {
    api.comingSoon().then(setUpcoming).catch(() => setUpcoming([]));
  }, []);

  // Filter options come from the movies themselves, so the pills never offer an empty result.
  const languages = useMemo(() => [...new Set((movies || []).flatMap((m) => m.languages))].sort(), [movies]);
  const genres = useMemo(() => [...new Set((movies || []).flatMap((m) => m.genres))].sort(), [movies]);

  const visible = useMemo(() => (movies || []).filter((m) =>
    (!language || m.languages.includes(language))
    && (!genre || m.genres.includes(genre))
    && (!search || m.title.toLowerCase().includes(search.toLowerCase()))), [movies, language, genre, search]);

  const featured = movies && !search ? movies.slice(0, 3) : [];

  return (
    <>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {!search && <Headline />}
        {featured.length > 0 && <Featured movies={featured} cityName={city.name} />}
        {!movies && !error && <Skeleton variant="rounded" height={380} sx={{ mt: 6 }} />}
      </Container>

      {!search && (
        <Marquee items={['Pick a seat', 'Hold it for 8 minutes', 'Pay', 'Done', `${(movies || []).length} films in ${city.name || 'your city'}`]} />
      )}

      <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 10 } }}>
        {search
          ? <SectionTitle bold="Results" italic={`for “${search}”`} count={movies ? visible.length : null} />
          : <SectionTitle bold="Now" italic="showing" count={movies ? visible.length : null} />}

        {movies && movies.length > 0 && (
          <Box sx={{ mt: { xs: 3, md: 4 }, display: 'grid', gap: 1 }}>
            <FilterRow name="Language" options={languages} value={language} onChange={setLanguage} />
            <FilterRow name="Genre" options={genres} value={genre} onChange={setGenre} />
          </Box>
        )}

        <Box sx={{ ...grid, mt: { xs: 4, md: 6 } }}>
          {!movies && !error && Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '2 / 3', height: 'auto' }} />
          ))}
          {visible.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} />)}
        </Box>

        {movies && visible.length === 0 && (
          <Box sx={{ py: 8, borderBlock: `1px solid ${colors.text}`, mt: 2 }}>
            <Box sx={{ ...shout, fontSize: { xs: 32, md: 56 } }}>Nothing matches</Box>
            <Box sx={{ mt: 1.5, color: colors.muted }}>
              Try removing a filter{search ? ' or searching for something else' : ''}.
            </Box>
            <Button sx={{ mt: 3 }} variant="outlined" component={Link} to="/"
              onClick={() => { setLanguage(''); setGenre(''); }}>
              Show all movies
            </Button>
          </Box>
        )}

        {upcoming.length > 0 && !search && (
          <Box sx={{ mt: { xs: 9, md: 16 } }}>
            <SectionTitle bold="Coming" italic="soon" count={upcoming.length} />
            <Box sx={{ mt: { xs: 3, md: 5 }, borderBottom: `1px solid ${colors.text}` }}>
              {upcoming.map((movie, index) => <UpcomingRow key={movie.id} movie={movie} index={index} />)}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
