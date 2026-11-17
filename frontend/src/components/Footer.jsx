import { Box, Container } from '@mui/material';
import { colors, label, shout } from '../theme';

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: { xs: 8, md: 14 }, bgcolor: colors.text, color: colors.bg, overflow: 'hidden' }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, ...label, opacity: 0.75 }}>
          <span>Pick a seat. Hold it. Pay. Done.</span>
          <span>A demo project: films, theatres and showtimes are fictional, and no real tickets are sold.</span>
        </Box>
        <Box aria-hidden sx={{
          ...shout, color: colors.accent, textAlign: 'center', whiteSpace: 'nowrap',
          fontSize: 'clamp(64px, 20.5vw, 330px)', lineHeight: 0.8, mt: { xs: 3, md: 4 }, mb: '-0.06em',
        }}>
          Showzo
        </Box>
      </Container>
    </Box>
  );
}
