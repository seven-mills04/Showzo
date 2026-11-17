import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Divider, InputBase, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';

import { colors, label, shout } from '../theme';
import { useAuth, useCity } from '../context';

export function Logo({ size = 24, invert = false }) {
  return (
    <Box component={Link} to="/" aria-label="Showzo home"
      sx={{ ...shout, fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', color: invert ? colors.bg : colors.text }}>
      Show
      <Box component="span" sx={{
        ml: '0.08em', px: '0.16em', pt: '0.04em', borderRadius: '0.22em',
        bgcolor: colors.accent, color: colors.accentInk, transform: 'rotate(-4deg)', display: 'inline-block',
      }}>zo</Box>
    </Box>
  );
}

// The small outlined capsule used for everything in the top bar.
const pill = {
  all: 'unset', ...label, boxSizing: 'border-box', fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 32, px: 1.5, borderRadius: 999,
  border: `1.5px solid ${colors.text}`, cursor: 'pointer', whiteSpace: 'nowrap', color: colors.text,
  transition: 'background-color .16s ease, color .16s ease',
  '&:hover': { bgcolor: colors.text, color: colors.bg },
  '&:focus-visible': { outline: `2px solid ${colors.cobalt}`, outlineOffset: 2 },
};
const pillSolid = { ...pill, bgcolor: colors.text, color: colors.bg, '&:hover': { bgcolor: colors.accent, color: colors.accentInk } };

const menuPaper = { sx: { minWidth: 200, mt: 1, border: `1.5px solid ${colors.text}`, boxShadow: `5px 5px 0 ${colors.text}`, borderRadius: 1.5 } };

function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') || '');

  useEffect(() => setText(params.get('q') || ''), [params]);

  const submit = (event) => {
    event.preventDefault();
    const q = text.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  return (
    <Box component="form" onSubmit={submit}
      sx={{
        display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75, height: 32, px: 1.5, width: 220,
        borderRadius: 999, border: `1.5px solid ${colors.text}`,
        transition: 'width .25s ease, background-color .2s ease',
        '&:focus-within': { width: 300, bgcolor: colors.surface },
      }}>
      <SearchRounded sx={{ fontSize: 16 }} />
      <InputBase value={text} onChange={(e) => setText(e.target.value)} placeholder="SEARCH MOVIES"
        inputProps={{ 'aria-label': 'Search movies' }}
        sx={{ flex: 1, ...label, fontSize: 11, fontWeight: 700, '& input': { p: 0, textTransform: 'none', letterSpacing: '0.02em', fontSize: 13, '&::placeholder': { ...label, opacity: 0.6 } } }} />
    </Box>
  );
}

function CityMenu() {
  const { cities, city, chooseCity } = useCity();
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Box component="button" type="button" onClick={(e) => setAnchor(e.currentTarget)} sx={pill}
        aria-haspopup="menu" aria-label={`City: ${city.name}. Change city`}>
        <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: colors.coral }} />
        {city.name || 'City'}
        <ExpandMoreRounded sx={{ fontSize: 15, mr: -0.5 }} />
      </Box>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: menuPaper }}>
        {cities.map((option) => (
          <MenuItem key={option.slug} selected={option.slug === city.slug}
            onClick={() => { chooseCity(option.slug); setAnchor(null); }} sx={{ ...label, fontSize: 12 }}>
            <Box sx={{ flex: 1 }}>{option.name}</Box>
            {option.slug === city.slug && <CheckRounded sx={{ fontSize: 16 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  if (!user) {
    return <Box component={Link} to="/sign-in" sx={pillSolid}>Sign in</Box>;
  }

  const go = (path) => { setAnchor(null); navigate(path); };

  return (
    <>
      <Box component="button" type="button" onClick={(e) => setAnchor(e.currentTarget)} sx={pillSolid} aria-haspopup="menu">
        {user.name.split(' ')[0]}
        <ExpandMoreRounded sx={{ fontSize: 15, mr: -0.5 }} />
      </Box>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: menuPaper }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={700}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go('/bookings')} sx={{ ...label, fontSize: 12 }}>
          <ListItemIcon><ConfirmationNumberOutlined fontSize="small" /></ListItemIcon>My bookings
        </MenuItem>
        <MenuItem onClick={() => { signOut(); go('/'); }} sx={{ ...label, fontSize: 12 }}>
          <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Header() {
  return (
    <Box component="header"
      sx={{ position: 'sticky', top: 0, zIndex: 20, bgcolor: 'rgba(241,239,232,0.86)', backdropFilter: 'blur(12px)' }}>
      <Container maxWidth="xl" sx={{ height: 60, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Logo />
        <Box sx={{ flex: 1 }} />
        <SearchBox />
        <CityMenu />
        <AccountMenu />
      </Container>
    </Box>
  );
}
