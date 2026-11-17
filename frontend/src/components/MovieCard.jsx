import { Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import StarRounded from '@mui/icons-material/StarRounded';
import { motion } from 'framer-motion';

import Poster from './Poster';
import { colors } from '../theme';
import { compactVotes, dayLabel } from '../format';

export default function MovieCard({ movie, index = 0, upcoming = false }) {
  return (
    <Box component={motion.div}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}>
      <Box component={Link} to={`/movies/${movie.slug}`}
        sx={{
          display: 'block',
          '& .poster': { transition: 'transform .25s ease' },
          '&:hover .poster, &:focus-visible .poster': { transform: 'translateY(-6px)' },
        }}>
        <Box className="poster"><Poster movie={movie} /></Box>
        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13.5, fontWeight: 700 }}>
          {upcoming ? (
            <Box sx={{ color: colors.accent }}>Releasing {dayLabel(movie.releaseDate).day} {dayLabel(movie.releaseDate).month}</Box>
          ) : (
            <>
              <StarRounded sx={{ fontSize: 17, color: colors.accent }} />
              {movie.rating.toFixed(1)}
              <Box component="span" sx={{ color: colors.muted, fontWeight: 500 }}>
                · {compactVotes(movie.votes)} votes
              </Box>
            </>
          )}
        </Box>
        <Typography sx={{ fontWeight: 700, mt: 0.25, lineHeight: 1.25 }}>{movie.title}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{movie.genres.join(' / ')}</Typography>
      </Box>
    </Box>
  );
}
