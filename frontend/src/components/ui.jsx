import { Box } from '@mui/material';
import { colors, label, serif, shout } from '../theme';

// Small building blocks shared by every page, so the whole site speaks the same visual language.

/** Heading made of a bold uppercase word and a serif italic word, e.g. NOW showing. */
export function SectionTitle({ bold, italic, count, size = 'lg', component = 'h2', sx }) {
  const fontSize = {
    lg: 'clamp(44px, 8vw, 132px)',
    md: 'clamp(38px, 5.6vw, 88px)',
    sm: 'clamp(30px, 3.6vw, 52px)',
  }[size];
  return (
    <Box component={component}
      sx={{ ...shout, m: 0, fontSize, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', columnGap: '0.18em', ...sx }}>
      {bold}
      {italic && (
        <Box component="span" sx={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: '-0.03em' }}>
          {italic}
        </Box>
      )}
      {count != null && <Box component="sup" sx={{ ...label, fontSize: { xs: 12, md: 16 }, mt: '0.6em' }}>({count})</Box>}
    </Box>
  );
}

/** One line of a spec sheet: small grey name on the left, value on the right, thin rule above. */
export function Spec({ name, value, strong }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, py: 0.9, borderTop: `1px solid ${colors.text}` }}>
      <Box sx={{ ...label, color: colors.muted, flexShrink: 0 }}>{name}</Box>
      <Box sx={strong ? { ...shout, fontSize: { xs: 26, md: 34 }, lineHeight: 1 } : { ...label, textAlign: 'right' }}>{value}</Box>
    </Box>
  );
}

const STACK = [
  { color: colors.coral, transform: 'translate(-7%, 4%) rotate(-7deg)' },
  { color: colors.cobalt, transform: 'translate(6%, 2%) rotate(5deg)' },
  { color: colors.accent, transform: 'translate(-2%, -3%) rotate(-2deg)' },
];

/** Three tilted coloured cards with the given content (a poster) sitting on top. */
export function CardStack({ children, sx }) {
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {STACK.map((card) => (
        <Box key={card.color} aria-hidden sx={{
          position: 'absolute', inset: 0, bgcolor: card.color, border: `1.5px solid ${colors.text}`, borderRadius: 1,
          transform: card.transform,
        }} />
      ))}
      <Box sx={{ position: 'relative' }}>{children}</Box>
    </Box>
  );
}

/** Small label with a coloured dot in front, used above headings. */
export function Eyebrow({ children, color = colors.coral, sx }) {
  return (
    <Box sx={{ ...label, display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      {children}
    </Box>
  );
}

/** Paper card with a hard ink outline and an offset block shadow. */
export const panel = {
  bgcolor: colors.surface,
  border: `1.5px solid ${colors.text}`,
  borderRadius: 1.5,
  boxShadow: `7px 7px 0 ${colors.text}`,
};
