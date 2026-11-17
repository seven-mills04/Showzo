import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, TextField } from '@mui/material';
import { motion } from 'framer-motion';

import { api } from '../api';
import { useAuth } from '../context';
import { colors, serif } from '../theme';
import { Eyebrow, SectionTitle, panel } from '../components/ui';

export default function AuthPage({ mode }) {
  const signUp = mode === 'sign-up';
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Only follow "next" when it points inside this site.
  const requested = params.get('next') || '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (signUp && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const response = signUp
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password });
      signIn(response);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const other = signUp ? '/sign-in' : '/sign-up';

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 8 } }}>
      <Box sx={{ display: 'grid', gap: { xs: 4, md: 8 }, alignItems: 'center', gridTemplateColumns: { xs: '1fr', md: '1fr minmax(340px, 440px)' } }}>
        <Box>
          <Eyebrow>{signUp ? 'New here' : 'Good to see you'}</Eyebrow>
          {signUp
            ? <SectionTitle bold="Grab a" italic="seat." size="lg" component="h1" sx={{ mt: 1 }} />
            : <SectionTitle bold="Welcome" italic="back." size="lg" component="h1" sx={{ mt: 1 }} />}
          <Box sx={{ fontFamily: serif, fontSize: { xs: 22, md: 28 }, lineHeight: 1.2, mt: { xs: 2, md: 3 }, maxWidth: 420 }}>
            {signUp ? 'Create an account in a few seconds, then book.' : 'Sign in to book seats and see your tickets.'}
          </Box>
        </Box>

        <Box component={motion.form} onSubmit={submit} noValidate
          initial={{ opacity: 0, y: 24, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          sx={{ ...panel, p: { xs: 2.5, md: 3.5 }, display: 'grid', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {signUp && (
            <TextField label="Name" value={form.name} onChange={change('name')} autoComplete="name" required
              slotProps={{ htmlInput: { maxLength: 80 } }} />
          )}
          <TextField label="Email" type="email" value={form.email} onChange={change('email')} autoComplete="email" required />
          <TextField label="Password" type="password" value={form.password} onChange={change('password')} required
            autoComplete={signUp ? 'new-password' : 'current-password'}
            helperText={signUp ? 'At least 8 characters' : undefined} />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}
          </Button>
          <Box sx={{ textAlign: 'center', fontSize: 14, color: colors.muted }}>
            {signUp ? 'Already have an account? ' : 'New to Showzo? '}
            <Box component={Link} to={`${other}?next=${encodeURIComponent(next)}`}
              sx={{ color: colors.text, fontWeight: 700, borderBottom: `1.5px solid ${colors.text}`, '&:hover': { bgcolor: colors.accent } }}>
              {signUp ? 'Sign in' : 'Create one'}
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
