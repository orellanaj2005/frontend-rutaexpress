import { useEffect, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useApi } from '../hooks/useApi';

const ESTADOS = ['CREADO', 'ACEPTADO', 'EN_BODEGA', 'EN_RUTA', 'ENTREGADO', 'CANCELADO'];

/**
 * Ver Caso RutaExpress, sección 6: "Listar, crear (cliente o despachador) y
 * cambiar estado (despachador/admin)". El BFF/shipments es quien realmente
 * valida la máquina de estados — acá solo se limita qué botones se muestran.
 */
export default function Shipments() {
  const { hasRole } = useRoles();
  const api = useApi();
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  function loadShipments() {
    api
      .get('/api/shipments')
      .then((res) => setShipments(res.data.content ?? res.data))
      .catch((err) => setError(err.response?.status ?? 'network'));
  }

  useEffect(loadShipments, [api]);

  function handleCreate() {
    api
      .post('/api/shipments', { serviceType: 'estandar' })
      .then(loadShipments)
      .catch((err) => setError(err.response?.status ?? 'network'));
  }

  function handleStatusChange(id, status) {
    api
      .put(`/api/shipments/${id}/status`, { status })
      .then(loadShipments)
      .catch((err) => setError(err.response?.status ?? 'network'));
  }

  const canCreate = hasRole('Cliente') || hasRole('Despachador');
  const canChangeStatus = hasRole('Despachador') || hasRole('Admin');

  return (
    <div className="page">
      <h1>Envíos</h1>

      {error && <p className="error-banner">Error al comunicarse con el BFF ({error}).</p>}

      {canCreate && <button onClick={handleCreate}>Crear envío</button>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Estado</th>
            {canChangeStatus && <th>Cambiar estado</th>}
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.status}</td>
              {canChangeStatus && (
                <td>
                  <select
                    value={s.status}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
