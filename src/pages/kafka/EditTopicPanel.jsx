import { useEffect, useState } from 'react';
import { CLEANUP_POLICIES, enc, hoursToMs, kafkaError, msToHours } from './kafkaUtils';

/** Panel de un tópico: cambiar retención / cleanup.policy y aumentar particiones. */
export default function EditTopicPanel({ api, topic, onChanged, onClose }) {
  const [entries, setEntries] = useState([]);
  const [original, setOriginal] = useState({ retentionHours: '', cleanupPolicy: '' });
  const [form, setForm] = useState({ retentionHours: '', cleanupPolicy: '' });
  const [totalPartitions, setTotalPartitions] = useState(String(topic.partitions + 1));
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function loadConfigs() {
    return api
      .get(`/api/kafka/topics/${enc(topic.name)}/configs`)
      .then((res) => {
        const list = res.data ?? [];
        setEntries(list);
        const retention = list.find((c) => c.name === 'retention.ms')?.value;
        const cleanup = list.find((c) => c.name === 'cleanup.policy')?.value ?? '';
        const values = { retentionHours: msToHours(retention), cleanupPolicy: cleanup };
        setOriginal(values);
        setForm(values);
        setError(null);
      })
      .catch((err) => setError(kafkaError(err)));
  }

  useEffect(() => {
    loadConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, topic.name]);

  function handleSave(e) {
    e.preventDefault();
    const set = {};
    if (form.retentionHours !== '' && form.retentionHours !== original.retentionHours) {
      set['retention.ms'] = hoursToMs(form.retentionHours);
    }
    if (form.cleanupPolicy && form.cleanupPolicy !== original.cleanupPolicy) {
      set['cleanup.policy'] = form.cleanupPolicy;
    }
    if (Object.keys(set).length === 0) {
      setNotice('No hay cambios que guardar.');
      return;
    }

    setSaving(true);
    setNotice(null);
    api
      .put(`/api/kafka/topics/${enc(topic.name)}/configs`, { set })
      .then(() => {
        setNotice('Configuración actualizada.');
        return Promise.all([loadConfigs(), onChanged()]);
      })
      .catch((err) => setError(kafkaError(err)))
      .finally(() => setSaving(false));
  }

  function handleIncreasePartitions(e) {
    e.preventDefault();
    const total = Number(totalPartitions);
    if (!Number.isInteger(total) || total <= topic.partitions) {
      setError(`Solo se pueden aumentar las particiones: ingresa un número mayor a ${topic.partitions}.`);
      return;
    }
    if (
      !window.confirm(
        `¿Aumentar "${topic.name}" de ${topic.partitions} a ${total} particiones? No se puede volver atrás.`
      )
    )
      return;

    setNotice(null);
    api
      .post(`/api/kafka/topics/${enc(topic.name)}/partitions`, { totalPartitions: total })
      .then((res) => {
        const warning = res.data?.warning ? ` ${res.data.warning}` : '';
        setNotice(`Particiones: ${res.data?.previousPartitions ?? topic.partitions} → ${res.data?.partitions ?? total}.${warning}`);
        setError(null);
        return onChanged();
      })
      .catch((err) => setError(kafkaError(err)));
  }

  const overrides = entries.filter((c) => !c.isDefault && !c.sensitive);

  return (
    <div className="create-form" style={{ display: 'block', marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>
        Configurar "{topic.name}"{' '}
        <button type="button" onClick={onClose} style={{ float: 'right' }}>
          Cerrar
        </button>
      </h3>
      {error && <p className="error-banner">{error}</p>}
      {notice && <p className="hint">{notice}</p>}

      <form onSubmit={handleSave} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Retención (horas)
          <input
            type="number"
            min="-1"
            step="any"
            style={{ width: 100 }}
            value={form.retentionHours}
            onChange={(e) => setForm({ ...form, retentionHours: e.target.value })}
          />
        </label>
        <label>
          cleanup.policy
          <select
            value={form.cleanupPolicy}
            onChange={(e) => setForm({ ...form, cleanupPolicy: e.target.value })}
          >
            {!CLEANUP_POLICIES.includes(form.cleanupPolicy) && (
              <option value={form.cleanupPolicy}>{form.cleanupPolicy || '—'}</option>
            )}
            {CLEANUP_POLICIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </form>

      <form
        onSubmit={handleIncreasePartitions}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}
      >
        <label>
          Total de particiones (hoy {topic.partitions})
          <input
            type="number"
            min={topic.partitions + 1}
            max="100"
            style={{ width: 80 }}
            value={totalPartitions}
            onChange={(e) => setTotalPartitions(e.target.value)}
          />
        </label>
        <button type="submit">Aumentar particiones</button>
      </form>
      <p className="hint">
        Aumentar particiones cambia en qué partición cae cada key: los mensajes nuevos de un mismo envío
        pueden ir a otra partición que los anteriores.
      </p>

      {overrides.length > 0 && (
        <>
          <h4>Configuración propia del tópico</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Valor</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.value}</td>
                  <td>{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
