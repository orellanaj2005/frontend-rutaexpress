import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function Reports() {
  const api = useApi();
  const [kpis, setKpis] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/report/kpis?range=last24h'),
      api.get('/api/report/top-services?range=last7d'),
    ])
      .then(([kpiRes, topRes]) => {
        setKpis(kpiRes.data);
        setTopServices(topRes.data);
      })
      .catch((err) => setError(err.response?.status ?? 'network'));
  }, [api]);

  return (
    <div className="page">
      <h1>Reportería</h1>
      {error && <p className="error-banner">Error al comunicarse con el BFF ({error}).</p>}

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
