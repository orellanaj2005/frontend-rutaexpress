import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import AutoRefreshBar from '../components/AutoRefreshBar';
import { readErrorMessage } from '../api/httpClient';

/**
 * Ver Caso RutaExpress, sección 6: "Timeline con filtros: usuario, fechas,
 * tipo de evento."
 *
 * Plan Kafka 4.9: el timeline se refresca solo cada 5 s (pausable) con los filtros
 * que estén aplicados, para que los eventos nuevos aparezcan sin recargar la página.
 */
export default function Audit() {
  const api = useApi();
  // `filters` es lo que el usuario está escribiendo; `applied` es lo que se consulta de verdad
  // (se actualiza al apretar "Buscar"), así el refresco no cambia los resultados mientras se tipea.
  const [filters, setFilters] = useState({ actor: '', eventType: '', from: '', to: '' });
  const [applied, setApplied] = useState({ actor: '', eventType: '', from: '', to: '' });
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  function loadTimeline() {
    const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
    return api
      .get('/api/audit/timeline', { params })
      .then((res) => {
        setEvents(res.data.content ?? res.data);
        setError(null);
      })
      .catch((err) => setError(readErrorMessage(err)));
  }

  const { paused, setPaused, lastUpdated } = usePolling(loadTimeline, 5000, applied);

  function handleSearch() {
    // Al cambiar `applied`, usePolling consulta de inmediato con los filtros nuevos.
    setApplied(filters);
  }

  return (
    <div className="page">
      <h1>Auditoría</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="filters">
        <input
          placeholder="Usuario"
          value={filters.actor}
          onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
        />
        <input
          placeholder="Tipo de evento"
          value={filters.eventType}
          onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
        />
        <input
          type="datetime-local"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          type="datetime-local"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <button onClick={handleSearch}>Buscar</button>
      </div>

      <AutoRefreshBar paused={paused} setPaused={setPaused} lastUpdated={lastUpdated} />

      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Envío</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>{e.occurredAt}</td>
              <td>{e.eventType}</td>
              <td>{e.shipmentId}</td>
              <td>{e.actor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
