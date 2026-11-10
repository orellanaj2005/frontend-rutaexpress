import { readErrorMessage } from '../../api/httpClient';

/** Constantes y funciones compartidas por las pantallas de administración de Kafka. */

export const CLEANUP_POLICIES = ['delete', 'compact', 'compact,delete'];
export const MS_PER_HOUR = 3600000;
export const DEFAULT_LAG_THRESHOLD = 100;

export const enc = encodeURIComponent;

/** El kafka-admin devuelve {error, message, fields?}: se muestra el mensaje y el detalle por campo. */
export function kafkaError(err) {
  const base = readErrorMessage(err);
  const fields = err.response?.data?.fields;
  if (fields && Object.keys(fields).length > 0) {
    return `${base}: ${Object.values(fields).join('; ')}`;
  }
  return base;
}

export function formatRetention(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 0) return 'Sin límite';
  const hours = ms / MS_PER_HOUR;
  if (hours >= 24) return `${Number((hours / 24).toFixed(1))} días`;
  if (hours >= 1) return `${Number(hours.toFixed(1))} h`;
  return `${Math.round(ms / 60000)} min`;
}

/** Horas (texto del formulario) -> milisegundos para retention.ms. "-1" significa sin límite. */
export function hoursToMs(hours) {
  const n = Number(hours);
  return n === -1 ? '-1' : String(Math.round(n * MS_PER_HOUR));
}

export function msToHours(ms) {
  if (ms === null || ms === undefined || ms === '') return '';
  const n = Number(ms);
  return n < 0 ? '-1' : String(Number((n / MS_PER_HOUR).toFixed(2)));
}

const pill = (bg, color) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 10,
  background: bg,
  color,
  fontSize: 11,
  fontWeight: 600,
  marginLeft: 6,
  verticalAlign: 'middle',
});

export const PILL_OK = pill('#dafbe1', '#1a7f37');
export const PILL_WARN = pill('#fff8c5', '#7d4e00');
export const PILL_BAD = pill('var(--danger-bg)', 'var(--danger)');
export const PILL_NEUTRAL = pill('#eaeef2', 'var(--ink-soft)');
