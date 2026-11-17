import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Container, Skeleton, Typography } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useCity } from '../context';
import { colors } from '../theme';
import { compactVotes } from '../format';
import MovieCard from '../components/MovieCard';
import Poster from '../components/Poster';

const grid = {
  display: 'grid',
  gap: { xs: 2, md: 3 },
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
};

function Hero({ movie }) {
  const color = movie.accentColor;
  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden', borderRadius: 4, border: `1px solid ${colors.line}`,
        background: `radial-gradient(120% 140% at 85% 10%, color-mix(in srgb, ${color} 70%, transparent) 0%, transparent 60%), ${colors.surface}`,
        p: { xs: 3, md: 6 }, display: 'flex', alignItems: 'center', gap: { xs: 3, md: 6 },
      }}>
      <Box component={motion.div} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ color: colors.accent }}>Top rated this week</Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 68 }, mt: 1, textWrap: 'balance' }}>
          {movie.title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 2.5, color: colors.muted, fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.text }}>
            <StarRounded sx={{ color: colors.accent }} />{movie.rating.toFixed(1)}
            <Box component="span" sx={{ color: colors.muted, fontWeight: 500 }}>({compactVotes(movie.votes)})</Box>
          </Box>
          <span>{movie.genres.join(' / ')}</span>
          <span>{movie.languages.join(', ')}</span>
        </Box>
        <Button component={Link} to={`/movies/${movie.slug}`} variant="contained" size="large"
          endIcon={<ArrowForwardRounded />} sx={{ mt: 4, whiteSpace: 'nowrap' }}>
          Book tickets
        </Button>
      </Box>
      <Box component={motion.div} initial={{ opacity: 0, rotate: 0, y: 24 }} animate={{ opacity: 1, rotate: 4, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        sx={{ width: { sm: 190, md: 240 }, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
        <Poster movie={movie} size="lg" />
      </Box>
    </Box>
  );
}

function FilterRow({ label, options, value, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography variant="overline" color="text.secondary" sx={{ width: 84 }}>{label}</Typography>
      {options.map((option) => {
        const active = option === value;
        return (
          <Chip key={option} label={option} size="small" clickable
            variant={active ? 'filled' : 'outlined'} color={active ? 'primary' : 'default'}
            onClick={() => onChange(active ? '' : option)} />
        );
      })}
    </Box>
  );
}

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

  // Filter options come from the movies themselves, so the chips never offer an empty result.
  const languages = useMemo(() => [...new Set((movies || []).flatMap((m) => m.languages))].sort(), [movies]);
  const genres = useMemo(() => [...new Set((movies || []).flatMap((m) => m.genres))].sort(), [movies]);

  const visible = useMemo(() => (movies || []).filter((m) =>
    (!language || m.languages.includes(language))
    && (!genre || m.genres.includes(genre))
    && (!search || m.title.toLowerCase().includes(search.toLowerCase()))), [movies, language, genre, search]);

  const featured = movies && movies.length > 0 && !search ? movies[0] : null;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {featured && <Hero movie={featured} />}
      {!movies && !error && <Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} />}

      <Box sx={{ mt: { xs: 5, md: 7 }, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 34 } }}>
          {search ? `Results for "${search}"` : `Now showing in ${city.name}`}
        </Typography>
        {movies && <Typography color="text.secondary">{visible.length} {visible.length === 1 ? 'movie' : 'movies'}</Typography>}
      </Box>

      {movies && movies.length > 0 && (
        <Box sx={{ mt: 2.5, display: 'grid', gap: 1.25 }}>
          <FilterRow label="Language" options={languages} value={language} onChange={setLanguage} />
          <FilterRow label="Genre" options={genres} value={genre} onChange={setGenre} />
        </Box>
      )}

      <Box sx={{ ...grid, mt: 4 }}>
        {!movies && !error && Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '2 / 3', height: 'auto' }} />
        ))}
        {visible.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} />)}
      </Box>

      {movies && visible.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h5">No movies match</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Try removing a filter{search ? ' or searching for something else' : ''}.
          </Typography>
          <Button sx={{ mt: 3 }} variant="outlined" component={Link} to="/"
            onClick={() => { setLanguage(''); setGenre(''); }}>
            Show all movies
          </Button>
        </Box>
      )}

      {upcoming.length > 0 && !search && (
        <>
          <Typography variant="h3" sx={{ fontSize: { xs: 26, md: 34 }, mt: { xs: 7, md: 9 } }}>Coming soon</Typography>
          <Box sx={{ ...grid, mt: 3 }}>
            {upcoming.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} upcoming />)}
          </Box>
        </>
      )}
    </Container>
  );
}
