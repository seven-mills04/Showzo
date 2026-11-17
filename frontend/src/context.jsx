import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api';

/* ---------- Who is logged in ---------- */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" is true until we know whether a saved token is still valid.
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((response) => {
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/* ---------- Which city the visitor is browsing ---------- */

const CityContext = createContext(null);
const CITY_KEY = 'showzo.city';
const DEFAULT_CITY = 'delhi-ncr';

const savedCity = () => {
  try {
    return localStorage.getItem(CITY_KEY) || DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
};

export function CityProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [citySlug, setCitySlug] = useState(savedCity);

  useEffect(() => {
    api.cities().then(setCities).catch(() => setCities([]));
  }, []);

  const chooseCity = useCallback((slug) => {
    setCitySlug(slug);
    try {
      localStorage.setItem(CITY_KEY, slug);
    } catch {
      // Not saved; the choice still applies for this visit.
    }
  }, []);

  const city = cities.find((c) => c.slug === citySlug) || { slug: citySlug, name: '' };
  const value = useMemo(() => ({ cities, city, chooseCity }), [cities, city, chooseCity]);
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export const useCity = () => useContext(CityContext);
