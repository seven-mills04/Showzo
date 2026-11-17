import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar, Box, Button, Container, Divider, InputBase, ListItemIcon, Menu, MenuItem, Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';

import { colors, display } from '../theme';
import { useAuth, useCity } from '../context';

export function Logo({ size = 26 }) {
  return (
    <Box component={Link} to="/" aria-label="Showzo home"
      sx={{ fontFamily: display, fontWeight: 800, fontSize: size, letterSpacing: '-0.05em', lineHeight: 1 }}>
      show<Box component="span" sx={{ color: colors.accent }}>zo</Box>
    </Box>
  );
}

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
        flex: 1, maxWidth: 440, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1,
        px: 2, height: 42, borderRadius: 999, bgcolor: colors.surface, border: `1px solid ${colors.line}`,
        '&:focus-within': { borderColor: colors.accent },
      }}>
      <SearchRounded sx={{ fontSize: 20, color: colors.muted }} />
      <InputBase value={text} onChange={(e) => setText(e.target.value)} placeholder="Search movies"
        inputProps={{ 'aria-label': 'Search movies' }} sx={{ flex: 1, fontSize: 14.5 }} />
    </Box>
  );
}

function CityMenu() {
  const { cities, city, chooseCity } = useCity();
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Button onClick={(e) => setAnchor(e.currentTarget)} color="inherit"
        startIcon={<PlaceOutlined sx={{ color: colors.accent }} />} endIcon={<ExpandMoreRounded />}
        sx={{ px: 1.5, whiteSpace: 'nowrap' }}>
        {city.name || 'City'}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 190, mt: 1, border: `1px solid ${colors.line}` } } }}>
        {cities.map((option) => (
          <MenuItem key={option.slug} selected={option.slug === city.slug}
            onClick={() => { chooseCity(option.slug); setAnchor(null); }}>
            <Box sx={{ flex: 1 }}>{option.name}</Box>
            {option.slug === city.slug && <CheckRounded sx={{ fontSize: 18, color: colors.accent }} />}
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
    return <Button component={Link} to="/sign-in" variant="contained" size="small" sx={{ py: 0.9 }}>Sign in</Button>;
  }

  const go = (path) => { setAnchor(null); navigate(path); };

  return (
    <>
      <Button onClick={(e) => setAnchor(e.currentTarget)} color="inherit" sx={{ px: 1, minWidth: 0, gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: colors.accent, color: colors.accentInk, fontWeight: 800, fontSize: 15 }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>{user.name.split(' ')[0]}</Box>
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 210, mt: 1, border: `1px solid ${colors.line}` } } }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={700}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go('/bookings')}>
          <ListItemIcon><ConfirmationNumberOutlined fontSize="small" /></ListItemIcon>My bookings
        </MenuItem>
        <MenuItem onClick={() => { signOut(); go('/'); }}>
          <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Header() {
  return (
    <Box component="header"
      sx={{
        position: 'sticky', top: 0, zIndex: 20, borderBottom: `1px solid ${colors.line}`,
        bgcolor: 'rgba(13,13,16,0.82)', backdropFilter: 'blur(14px)',
      }}>
      <Container maxWidth="lg" sx={{ height: 68, display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
        <Logo />
        <SearchBox />
        <Box sx={{ flex: { xs: 1, sm: 0 } }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { sm: 'auto' } }}>
          <CityMenu />
          <AccountMenu />
        </Box>
      </Container>
    </Box>
  );
}
