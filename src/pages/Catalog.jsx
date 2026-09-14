import { useEffect, useState } from 'react';
import { useRoles } from '../hooks/useRoles';
import { useApi } from '../hooks/useApi';

export default function Catalog() {
  const { hasRole } = useRoles();
  const api = useApi();
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [editValues, setEditValues] = useState({}); // { [serviceId]: { rate, capacity } }

  const canEdit = hasRole('Admin');

  function loadServices() {
    api
      .get('/api/catalog/services')
      .then((res) => setServices(res.data.content ?? res.data))
      .catch((err) => setError(err.response?.status ?? 'network'));
  }

  useEffect(loadServices, [api]);

  function startEditing(service) {
    setEditValues((prev) => ({
      ...prev,
      [service.id]: { rate: service.rate, capacity: service.capacity },
    }));
  }

  function cancelEditing(id) {
    setEditValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateField(id, field, value) {
    setEditValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function handleSave(id) {
    const values = editValues[id];
    if (!values) return;

    setSavingId(id);
    setError(null);

    api
      .put(`/api/catalog/services/${id}`, {
        rate: Number(values.rate),
        capacity: Number(values.capacity),
      })
      .then(() => {
        cancelEditing(id);
        loadServices();
      })
      .catch((err) => setError(err.response?.status ?? 'network'))
      .finally(() => setSavingId(null));
  }

  return (
    <div className="page">
      <h1>Catálogo de servicios</h1>
      {error && (
        <p className="error-banner">
          Error al comunicarse con el BFF ({error === 403 ? 'sin permiso' : error}).
        </p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Tarifa</th>
            <th>Capacidad</th>
            {canEdit && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => {
            const isEditing = Boolean(editValues[s.id]);
            const isSaving = savingId === s.id;

            return (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[s.id].rate}
                      onChange={(e) => updateField(s.id, 'rate', e.target.value)}
                    />
                  ) : (
                    s.rate
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues[s.id].capacity}
                      onChange={(e) => updateField(s.id, 'capacity', e.target.value)}
                    />
                  ) : (
                    s.capacity
                  )}
                </td>
                {canEdit && (
                  <td className="row-actions">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSave(s.id)} disabled={isSaving}>
                          {isSaving ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button onClick={() => cancelEditing(s.id)} disabled={isSaving}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEditing(s)}>Editar</button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}