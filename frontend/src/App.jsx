import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MoviePage from './pages/MoviePage';
import SeatsPage from './pages/SeatsPage';
import CheckoutPage from './pages/CheckoutPage';
import TicketPage from './pages/TicketPage';
import BookingsPage from './pages/BookingsPage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context';

// Pages that need a logged-in user send visitors to sign in, then bring them back.
function Private({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) {
    return <Navigate to={`/sign-in?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'clip' }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies/:slug" element={<MoviePage />} />
          <Route path="/shows/:showId/seats" element={<SeatsPage />} />
          <Route path="/shows/:showId/checkout" element={<Private><CheckoutPage /></Private>} />
          <Route path="/bookings" element={<Private><BookingsPage /></Private>} />
          <Route path="/bookings/:bookingId" element={<Private><TicketPage /></Private>} />
          <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
          <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}
