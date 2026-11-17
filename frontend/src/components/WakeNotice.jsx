import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { api } from '../api';
import { colors, label } from '../theme';

const SHOW_AFTER_MS = 2500;

/**
 * The API runs on a free hosting plan that goes to sleep when nobody is using it, and the first
 * visit afterwards can take up to a minute. If the server has not answered within a couple of
 * seconds, this bar explains the wait instead of leaving the page looking broken.
 */
export default function WakeNotice() {
  const [state, setState] = useState('checking'); // checking | waking | ready

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { if (!cancelled) setState((s) => (s === 'checking' ? 'waking' : s)); }, SHOW_AFTER_MS);

    const ping = () => api.health()
      .then(() => { if (!cancelled) setState('ready'); })
      .catch(() => { if (!cancelled) setTimeout(ping, 4000); });
    ping();

    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  if (state !== 'waking') return null;

  return (
    <Box role="status" sx={{
      ...label, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, px: 2, py: 1,
      bgcolor: colors.accent, color: colors.accentInk, borderBottom: `1.5px solid ${colors.text}`, textAlign: 'center',
      '@keyframes showzo-pulse': { '50%': { opacity: 0.25 } },
    }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.text, flexShrink: 0, animation: 'showzo-pulse 1s ease-in-out infinite' }} />
      Waking up the server. This free demo sleeps when idle, so the first load can take up to a minute.
    </Box>
  );
}
