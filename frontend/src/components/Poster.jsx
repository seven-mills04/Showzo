import { Box } from '@mui/material';
import { display } from '../theme';

// Posters are drawn in the browser from the movie's colour and title, so the app needs no image files.
// The title decides which of three patterns is used, so a movie always gets the same artwork.
const patternFor = (text) => {
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  return sum % 3;
};

function Pattern({ kind }) {
  const stroke = 'rgba(255,255,255,0.16)';
  if (kind === 0) {
    return (
      <g fill="none" stroke={stroke} strokeWidth="1.5">
        {[40, 75, 110, 145, 180, 215, 250].map((r) => <circle key={r} cx="200" cy="70" r={r} />)}
      </g>
    );
  }
  if (kind === 1) {
    return (
      <g stroke={stroke} strokeWidth="14">
        {[-120, -60, 0, 60, 120, 180, 240].map((x) => <line key={x} x1={x} y1="300" x2={x + 200} y2="0" />)}
      </g>
    );
  }
  return (
    <g>
      <circle cx="100" cy="118" r="62" fill="rgba(255,255,255,0.2)" />
      <g stroke={stroke} strokeWidth="2">
        {[150, 166, 182, 198, 214].map((y) => <line key={y} x1="0" y1={y} x2="200" y2={y} />)}
      </g>
    </g>
  );
}

export default function Poster({ movie, size = 'md', sx }) {
  const color = movie.accentColor || '#444';
  const titleSize = { sm: 15, md: 21, lg: 30 }[size];

  return (
    <Box
      sx={{
        position: 'relative', aspectRatio: '2 / 3', borderRadius: 2, overflow: 'hidden',
        background: `linear-gradient(165deg, color-mix(in srgb, ${color} 80%, #fff) 0%, ${color} 38%, color-mix(in srgb, ${color} 35%, #000) 100%)`,
        boxShadow: '0 18px 40px -18px rgba(0,0,0,0.9)',
        ...sx,
      }}>
      <Box component="svg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <Pattern kind={patternFor(movie.title)} />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55) 100%)' }} />
      <Box
        sx={{
          position: 'absolute', top: 12, left: 12, px: 0.9, py: 0.2, borderRadius: 0.75,
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em',
          bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
        }}>
        {movie.certificate}
      </Box>
      <Box
        sx={{
          position: 'absolute', left: 14, right: 14, bottom: 14, color: '#fff',
          fontFamily: display, fontWeight: 800, fontSize: titleSize, lineHeight: 1.02,
          letterSpacing: '-0.03em', textWrap: 'balance', textShadow: '0 2px 14px rgba(0,0,0,0.35)',
        }}>
        {movie.title}
      </Box>
    </Box>
  );
}
