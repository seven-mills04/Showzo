// Every call to the backend goes through here.
// In development VITE_API_URL is empty and Vite forwards /api to localhost:8080.
const BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'showzo.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked (private mode). The user just stays logged in for this tab only.
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body (e.g. a bare 401).
  }

  if (!response.ok) {
    const fallback = response.status === 401 ? 'Please sign in to continue.' : 'Something went wrong.';
    throw new ApiError(response.status, (data && data.message) || fallback);
  }
  return data;
}

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return search.toString();
};

export const api = {
  cities: () => request('GET', '/api/cities'),
  movies: (city, filters = {}) => request('GET', `/api/movies?${query({ city, ...filters })}`),
  comingSoon: () => request('GET', '/api/movies/coming-soon'),
  movie: (slug) => request('GET', `/api/movies/${slug}`),
  shows: (slug, city, date) => request('GET', `/api/movies/${slug}/shows?${query({ city, date })}`),

  register: (form) => request('POST', '/api/auth/register', form),
  login: (form) => request('POST', '/api/auth/login', form),
  me: () => request('GET', '/api/auth/me'),

  seatMap: (showId) => request('GET', `/api/shows/${showId}/seats`),
  holdSeats: (showId, seats) => request('POST', `/api/shows/${showId}/holds`, { seats }),
  releaseSeats: (showId) => request('DELETE', `/api/shows/${showId}/holds`),

  checkout: (showId) => request('POST', `/api/shows/${showId}/checkout`),
  confirm: (bookingId, payment) => request('POST', `/api/bookings/${bookingId}/confirm`, payment),
  bookings: () => request('GET', '/api/bookings'),
  booking: (id) => request('GET', `/api/bookings/${id}`),
};
