import { useEffect, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useApi } from '../hooks/useApi';

export default function Catalog() {
  const { hasRole } = useRoles();
  const api = useApi();
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/api/catalog/services')
      .then((res) => setServices(res.data.content ?? res.data))
      .catch((err) => setError(err.response?.status ?? 'network'));
  }, [api]);

  return (
    <div className="page">
      <h1>Catálogo de servicios</h1>
      {error && <p className="error-banner">Error al comunicarse con el BFF ({error}).</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Tarifa</th>
            <th>Capacidad</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.rate}</td>
              <td>{s.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasRole('Admin') && <p className="hint">Como Admin puedes editar tarifa y capacidad (pendiente de UI de edición).</p>}
    </div>
  );
}
