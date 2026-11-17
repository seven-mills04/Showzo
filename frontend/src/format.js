// Small helpers for showing money, dates and times the Indian way.

export const rupees = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const duration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

// The server sends show times as local Indian time without a zone, e.g. "2026-11-20T19:15:00".
const parts = (dateTime) => {
  const [date, time] = dateTime.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return { year, month, day, hour, minute };
};

export const clock = (dateTime) => {
  const { hour, minute } = parts(dateTime);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dayLabel = (dateTime) => {
  const { year, month, day } = parts(dateTime.includes('T') ? dateTime : `${dateTime}T00:00:00`);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { weekday, day, month: MONTHS[month - 1], text: `${weekday}, ${day} ${MONTHS[month - 1]}` };
};

// Today's date in India as "YYYY-MM-DD", whatever time zone the browser is in.
export const todayInIndia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export const addDays = (isoDate, days) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export const compactVotes = (votes) =>
  votes >= 1000 ? `${(votes / 1000).toFixed(1).replace('.0', '')}K` : String(votes);
