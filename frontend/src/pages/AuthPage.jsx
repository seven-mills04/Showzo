import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';

import { api } from '../api';
import { useAuth } from '../context';
import { colors } from '../theme';

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
    <Container maxWidth="xs" sx={{ pt: { xs: 5, md: 9 } }}>
      <Typography variant="h2" sx={{ fontSize: { xs: 34, md: 42 } }}>
        {signUp ? 'Create your account' : 'Welcome back'}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {signUp ? 'It takes a few seconds, then you can book.' : 'Sign in to book seats and see your tickets.'}
      </Typography>

      <Box component="form" onSubmit={submit} noValidate
        sx={{ mt: 4, p: 3, display: 'grid', gap: 2, borderRadius: 3, bgcolor: colors.surface, border: `1px solid ${colors.line}` }}>
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
      </Box>

      <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
        {signUp ? 'Already have an account? ' : 'New to Showzo? '}
        <Box component={Link} to={`${other}?next=${encodeURIComponent(next)}`} sx={{ color: colors.accent, fontWeight: 700 }}>
          {signUp ? 'Sign in' : 'Create one'}
        </Box>
      </Typography>
    </Container>
  );
}
