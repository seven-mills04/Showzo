import { Link } from 'react-router-dom';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

import Poster from './Poster';
import { colors, label } from '../theme';
import { compactVotes } from '../format';

// The coloured block that slides out from behind a poster on hover.
const FRAME_COLORS = [colors.cobalt, colors.coral, colors.accent];

export default function MovieCard({ movie, index = 0 }) {
  const frame = FRAME_COLORS[index % FRAME_COLORS.length];
  return (
    <Box component={motion.div}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 5) * 0.06, ease: [0.2, 0.7, 0.2, 1] }}>
      <Box component={Link} to={`/movies/${movie.slug}`}
        sx={{
          display: 'block',
          '& .poster': { transition: 'transform .22s cubic-bezier(.2,.7,.2,1), box-shadow .22s cubic-bezier(.2,.7,.2,1)', boxShadow: `0 0 0 ${frame}`, borderRadius: 1 },
          '&:hover .poster, &:focus-visible .poster': { transform: 'translate(-6px, -6px) rotate(-1.2deg)', boxShadow: `9px 9px 0 ${frame}` },
          '&:focus-visible': { outline: 'none' },
        }}>
        <Box className="poster"><Poster movie={movie} /></Box>

        <Box sx={{ ...label, display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1.5, pb: 0.75, borderBottom: `1px solid ${colors.text}` }}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span>★ {movie.rating.toFixed(1)} <Box component="span" sx={{ color: colors.muted }}>({compactVotes(movie.votes)})</Box></span>
        </Box>
        <Box sx={{ ...label, color: colors.muted, mt: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {movie.genres.join(' / ')} · {movie.languages.join(', ')}
        </Box>
      </Box>
    </Box>
  );
}
