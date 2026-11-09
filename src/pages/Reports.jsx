import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import AutoRefreshBar from '../components/AutoRefreshBar';
import { readErrorMessage } from '../api/httpClient';

/**
 * Plan Kafka 4.9: el dashboard se refresca solo cada 5 s (pausable), así los KPIs
 * reflejan los eventos nuevos de shipments.events sin recargar la página.
 */
export default function Reports() {
  const api = useApi();
  const [kpis, setKpis] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [error, setError] = useState(null);

  function loadReports() {
    return Promise.all([
      api.get('/api/report/kpis?range=last24h'),
      api.get('/api/report/top-services?range=last7d'),
    ])
      .then(([kpiRes, topRes]) => {
        setKpis(kpiRes.data);
        setTopServices(topRes.data);
        setError(null);
      })
      .catch((err) => setError(readErrorMessage(err)));
  }

  const { paused, setPaused, lastUpdated } = usePolling(loadReports);

  return (
    <div className="page">
      <h1>Reportería</h1>
      {error && <p className="error-banner">{error}</p>}

      <AutoRefreshBar paused={paused} setPaused={setPaused} lastUpdated={lastUpdated} />

      {kpis && (
        <section>
          <h2>Envíos por hora / lead time</h2>
          <ul>
            {kpis.shipmentsByStatus?.map((row) => (
              <li key={row.status}>
                {row.status}: {row.count}
              </li>
            ))}
          </ul>
          <p>Lead time promedio: {kpis.averageLeadTimeMinutes ?? '—'} min</p>
        </section>
      )}

      <section>
        <h2>Servicios más usados</h2>
        <ul>
          {topServices.map((row) => (
            <li key={row.serviceType}>
              {row.serviceType}: {row.count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
