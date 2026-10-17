import { useEffect, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useApi } from '../hooks/useApi';

/**
 * Ver Caso RutaExpress, sección 6: "Admin ve KPIs de la red. Despachador ve
 * envíos en bodega y en ruta. Cliente ve sus últimos envíos y estado."
 */
export default function Dashboard() {
  const { hasRole, loading } = useRoles();
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // hasRole se recrea en cada render: depender de él volvía a ejecutar el efecto
  // tras cada respuesta y dejaba el dashboard pidiendo KPIs en bucle.
  const isAdmin = hasRole('Admin');

  useEffect(() => {
    if (loading) return;
    const endpoint = isAdmin
      ? '/api/report/kpis?range=last24h'
      : '/api/shipments'; // Despachador/Cliente: el BFF filtra por rol qué envíos les devuelve

    api
      .get(endpoint)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.status ?? 'network'));
  }, [api, isAdmin, loading]);

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {error && (
        <p className="error-banner">
          No se pudo cargar el dashboard ({error === 403 ? 'sin permiso' : `error ${error}`}).
        </p>
      )}

      {hasRole('Admin') && data && (
        <section>
          <h2>KPIs de la red</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-value">{data.activeShipments ?? '—'}</span>
              <span className="kpi-label">Envíos activos</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">
                {data.averageLeadTimeMinutes ? `${Math.round(data.averageLeadTimeMinutes)} min` : '—'}
              </span>
              <span className="kpi-label">Lead time promedio</span>
            </div>
          </div>
        </section>
      )}

      {!hasRole('Admin') && data && (
        <section>
          <h2>Tus envíos recientes</h2>
          <ul className="shipment-list">
            {(Array.isArray(data) ? data : data.content ?? []).map((s) => (
              <li key={s.id}>
                #{s.id} — {s.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
