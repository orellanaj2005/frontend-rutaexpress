import { useState } from 'react';
import { useApi } from '../hooks/useApi';

/**
 * Ver Caso RutaExpress, sección 6: "Timeline con filtros: usuario, fechas,
 * tipo de evento."
 */
export default function Audit() {
  const api = useApi();
  const [filters, setFilters] = useState({ actor: '', eventType: '', from: '', to: '' });
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  function handleSearch() {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api
      .get('/api/audit/timeline', { params })
      .then((res) => setEvents(res.data.content ?? res.data))
      .catch((err) => setError(err.response?.status ?? 'network'));
  }

  return (
    <div className="page">
      <h1>Auditoría</h1>
      {error && <p className="error-banner">Error al comunicarse con el BFF ({error}).</p>}

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
