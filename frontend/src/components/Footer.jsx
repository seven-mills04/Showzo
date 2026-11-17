import { Box, Container, Typography } from '@mui/material';
import { colors } from '../theme';
import { Logo } from './Header';

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: `1px solid ${colors.line}`, mt: 10, py: 4 }}>
      <Container maxWidth="lg"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Logo size={20} />
        <Typography variant="body2" color="text.secondary">
          A demo project. Movies, theatres and showtimes are fictional, and no real tickets are sold.
        </Typography>
      </Container>
    </Box>
  );
}
