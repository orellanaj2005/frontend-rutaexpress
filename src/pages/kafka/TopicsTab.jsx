import { useEffect, useState } from 'react';
import EditTopicPanel from './EditTopicPanel';
import {
  CLEANUP_POLICIES,
  PILL_NEUTRAL,
  enc,
  formatRetention,
  hoursToMs,
  kafkaError,
} from './kafkaUtils';

/** Pestaña Tópicos: tabla, creación y eliminación. La edición está en EditTopicPanel. */
const EMPTY_TOPIC_FORM = {
  name: '',
  partitions: '3',
  replicationFactor: '3',
  retentionHours: '',
  cleanupPolicy: '',
};

export default function TopicsTab({ api }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(EMPTY_TOPIC_FORM);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // nombre del tópico en edición

  function loadTopics() {
    setLoading(true);
    return api
      .get('/api/kafka/topics')
      .then((res) => {
        setTopics(res.data ?? []);
        setError(null);
      })
      .catch((err) => setError(kafkaError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  function handleCreate(e) {
    e.preventDefault();
    const configs = {};
    if (form.retentionHours !== '') configs['retention.ms'] = hoursToMs(form.retentionHours);
    if (form.cleanupPolicy) configs['cleanup.policy'] = form.cleanupPolicy;

    setCreating(true);
    setNotice(null);
    api
      .post('/api/kafka/topics', {
        name: form.name,
        partitions: Number(form.partitions),
        replicationFactor: Number(form.replicationFactor),
        configs,
      })
      .then(() => {
        setNotice(`Tópico "${form.name.trim()}" creado.`);
        setForm(EMPTY_TOPIC_FORM);
        setError(null);
        return loadTopics();
      })
      .catch((err) => setError(kafkaError(err)))
      .finally(() => setCreating(false));
  }

  function handleDelete(topic) {
    if (
      !window.confirm(
        `¿Eliminar el tópico "${topic.name}"? Se pierden todos sus mensajes y no se puede deshacer.`
      )
    )
      return;
    setNotice(null);
    api
      .delete(`/api/kafka/topics/${enc(topic.name)}`)
      .then(() => {
        setNotice(`Tópico "${topic.name}" eliminado.`);
        setError(null);
        if (editing === topic.name) setEditing(null);
        return loadTopics();
      })
      .catch((err) => setError(kafkaError(err)));
  }

  const editingTopic = topics.find((t) => t.name === editing);

  return (
    <div>
      {error && <p className="error-banner">{error}</p>}
      {notice && <p className="hint">{notice}</p>}

      <form className="create-form" onSubmit={handleCreate}>
        <input
          placeholder="Nombre del tópico"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <label>
          Particiones
          <input
            type="number"
            min="1"
            max="100"
            style={{ width: 70 }}
            value={form.partitions}
            onChange={(e) => setForm({ ...form, partitions: e.target.value })}
            required
          />
        </label>
        <label>
          Réplicas
          <input
            type="number"
            min="1"
            max="3"
            style={{ width: 60 }}
            value={form.replicationFactor}
            onChange={(e) => setForm({ ...form, replicationFactor: e.target.value })}
            required
          />
        </label>
        <label>
          Retención (horas)
          <input
            type="number"
            min="-1"
            step="any"
            style={{ width: 90 }}
            placeholder="defecto"
            value={form.retentionHours}
            onChange={(e) => setForm({ ...form, retentionHours: e.target.value })}
          />
        </label>
        <select
          value={form.cleanupPolicy}
          onChange={(e) => setForm({ ...form, cleanupPolicy: e.target.value })}
        >
          <option value="">cleanup.policy (defecto)</option>
          {CLEANUP_POLICIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit" disabled={creating}>
          {creating ? 'Creando…' : 'Crear tópico'}
        </button>
      </form>

      <p className="hint" style={{ marginTop: 0 }}>
        Retención en horas; -1 significa sin límite. Las réplicas no pueden superar 3 (el clúster tiene 3 brokers).
      </p>

      <div style={{ margin: '8px 0' }}>
        <button onClick={loadTopics} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Tópico</th>
            <th>Particiones</th>
            <th>Réplicas</th>
            <th>Retención</th>
            <th>cleanup.policy</th>
            <th>min.insync</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => (
            <tr key={t.name}>
              <td>
                {t.name}
                {t.protectedTopic && <span style={PILL_NEUTRAL}>protegido</span>}
              </td>
              <td>{t.partitions}</td>
              <td>{t.replicationFactor}</td>
              <td>{formatRetention(t.retentionMs)}</td>
              <td>{t.cleanupPolicy ?? '—'}</td>
              <td>{t.minInsyncReplicas ?? '—'}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => setEditing(editing === t.name ? null : t.name)}>
                    {editing === t.name ? 'Cerrar' : 'Configurar'}
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={t.protectedTopic}
                    title={t.protectedTopic ? 'Tópico del contrato: no se puede eliminar' : ''}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && topics.length === 0 && (
            <tr>
              <td colSpan={7}>No hay tópicos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>

      {editingTopic && (
        <EditTopicPanel
          key={editingTopic.name}
          api={api}
          topic={editingTopic}
          onChanged={loadTopics}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
