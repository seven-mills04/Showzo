import { createTheme } from '@mui/material/styles';

// One place for every colour and font in the app.
export const colors = {
  bg: '#F1EFE8',        // warm paper
  surface: '#FAF9F5',   // cards
  raised: '#E7E4DA',
  line: 'rgba(11,11,11,0.16)',
  text: '#0B0B0B',      // ink
  muted: '#6B685F',
  accent: '#C8FF2E',    // lime: fills and highlights only, never text on paper
  accentInk: '#0B0B0B',
  cobalt: '#1F3BFF',    // links and coloured text
  coral: '#FF4B2B',
  danger: '#D92D10',
  success: '#0E8A4F',
};

export const display = '"Archivo Variable", "Arial Black", sans-serif';
export const serif = '"Instrument Serif", Georgia, serif';
const body = '"Inter Tight Variable", "Segoe UI", sans-serif';

// Big shouting headline style shared by every page.
export const shout = {
  fontFamily: display,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '-0.045em',
  lineHeight: 0.9,
};

// Small uppercase label, like the captions on a film poster.
export const label = {
  fontFamily: body,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const heading = { ...shout, lineHeight: 0.95 };

const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: colors.bg, paper: colors.surface },
    primary: { main: colors.text, contrastText: colors.bg },
    secondary: { main: colors.cobalt },
    error: { main: colors.danger },
    success: { main: colors.success },
    text: { primary: colors.text, secondary: colors.muted },
    divider: colors.line,
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: body,
    h1: heading,
    h2: heading,
    h3: heading,
    h4: { ...heading, letterSpacing: '-0.035em' },
    h5: { ...heading, letterSpacing: '-0.03em', lineHeight: 1 },
    h6: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 },
    button: { ...label, fontSize: 12, fontWeight: 700 },
    overline: { ...label, lineHeight: 1.6 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.bg },
        '::selection': { background: colors.accent, color: colors.accentInk },
        a: { color: 'inherit', textDecoration: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999, paddingInline: 20, paddingBlock: 10,
          transition: 'background-color .18s ease, color .18s ease, transform .18s ease',
        },
        sizeLarge: { paddingInline: 28, paddingBlock: 15, fontSize: 13 },
        containedPrimary: { '&:hover': { backgroundColor: colors.accent, color: colors.accentInk } },
        outlined: { borderColor: colors.text, color: colors.text, '&:hover': { backgroundColor: colors.text, color: colors.bg, borderColor: colors.text } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { ...label, borderRadius: 999, height: 26 },
        outlined: { borderColor: colors.text },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: colors.surface },
        notchedOutline: { borderColor: colors.text },
      },
    },
    MuiSkeleton: { styleOverrides: { root: { backgroundColor: 'rgba(11,11,11,0.08)' } } },
  },
});

export default theme;
