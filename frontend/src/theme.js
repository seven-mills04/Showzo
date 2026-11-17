import { createTheme } from '@mui/material/styles';

// One place for every colour and font in the app.
export const colors = {
  bg: '#0D0D10',
  surface: '#16161B',
  raised: '#1F1F27',
  line: 'rgba(255,255,255,0.09)',
  text: '#F4F1EA',
  muted: '#9C998F',
  accent: '#FFC531',
  accentInk: '#17130A',
  danger: '#FF6B57',
  success: '#5BD6A0',
};

const display = '"Bricolage Grotesque Variable", "Segoe UI", sans-serif';
const body = '"DM Sans Variable", "Segoe UI", sans-serif';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: colors.bg, paper: colors.surface },
    primary: { main: colors.accent, contrastText: colors.accentInk },
    error: { main: colors.danger },
    success: { main: colors.success },
    text: { primary: colors.text, secondary: colors.muted },
    divider: colors.line,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02 },
    h2: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05 },
    h3: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: display, fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontFamily: display, fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
    overline: { fontWeight: 700, letterSpacing: '0.14em', fontSize: '0.7rem' },
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
        root: { borderRadius: 999, paddingInline: 22, paddingBlock: 10 },
        sizeLarge: { paddingInline: 28, paddingBlock: 13, fontSize: '1rem' },
        outlined: { borderColor: colors.line, color: colors.text },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        outlined: { borderColor: colors.line },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: colors.surface },
        notchedOutline: { borderColor: colors.line },
      },
    },
  },
});

export { display };
export default theme;
