import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { readErrorMessage } from '../api/httpClient';

const TABS = [
  { key: 'queues', label: 'Colas' },
  { key: 'exchanges', label: 'Exchanges' },
  { key: 'bindings', label: 'Bindings' },
];

const EXCHANGE_TYPES = ['DIRECT', 'TOPIC', 'FANOUT', 'HEADERS'];

/** Una cola cuenta como DLQ si termina en .dlq o es la cola de auditoría de mensajes muertos. */
function isDeadLetterQueue(name) {
  return name === 'q.audit.deadletter' || name.endsWith('.dlq');
}


export default function RabbitAdmin() {
  const api = useApi();
  const [tab, setTab] = useState('queues');

  const [queues, setQueues] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [bindings, setBindings] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadAll() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/api/rabbitmq/queues'),
      api.get('/api/rabbitmq/exchanges'),
      api.get('/api/rabbitmq/bindings'),
    ])
      .then(([q, e, b]) => {
        setQueues(q.data ?? []);
        setExchanges(e.data ?? []);
        setBindings(b.data ?? []);
      })
      .catch((err) => setError(readErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, [api]);

  return (
    <div className="page">
      <h1>Administración de RabbitMQ</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p>Cargando…</p>}

      {!loading && tab === 'queues' && (
        <QueuesTab api={api} queues={queues} onChanged={loadAll} onError={(e) => setError(readErrorMessage(e))} />
      )}
      {!loading && tab === 'exchanges' && (
        <ExchangesTab api={api} exchanges={exchanges} onChanged={loadAll} onError={(e) => setError(readErrorMessage(e))} />
      )}
      {!loading && tab === 'bindings' && (
        <BindingsTab api={api} bindings={bindings} onChanged={loadAll} onError={(e) => setError(readErrorMessage(e))} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Colas

function QueuesTab({ api, queues, onChanged, onError }) {
  const [form, setForm] = useState({ name: '', durable: true, deadLetterExchange: '', messageTtl: '' });
  const [creating, setCreating] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    api
      .post('/api/rabbitmq/queues', {
        name: form.name,
        durable: form.durable,
        deadLetterExchange: form.deadLetterExchange || null,
        messageTtl: form.messageTtl ? Number(form.messageTtl) : null,
      })
      .then(() => {
        setForm({ name: '', durable: true, deadLetterExchange: '', messageTtl: '' });
        onChanged();
      })
      .catch(onError)
      .finally(() => setCreating(false));
  }

  function handleDelete(name) {
    if (!window.confirm(`¿Eliminar la cola "${name}"? Esta acción no se puede deshacer.`)) return;
    api.delete(`/api/rabbitmq/queues/${encodeURIComponent(name)}`).then(onChanged).catch(onError);
  }

  return (
    <div>
      <form className="create-form" onSubmit={handleCreate}>
        <input
          placeholder="Nombre de la cola"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={form.durable}
            onChange={(e) => setForm({ ...form, durable: e.target.checked })}
          />
          Durable
        </label>
        <input
          placeholder="Dead-letter exchange (opcional)"
          value={form.deadLetterExchange}
          onChange={(e) => setForm({ ...form, deadLetterExchange: e.target.value })}
        />
        <input
          type="number"
          placeholder="TTL en ms (opcional)"
          value={form.messageTtl}
          onChange={(e) => setForm({ ...form, messageTtl: e.target.value })}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Creando…' : 'Crear cola'}
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Mensajes</th>
            <th>Durable</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {queues.map((q) => (
            <tr key={q.name} className={isDeadLetterQueue(q.name) ? 'dlq-row' : ''}>
              <td>
                {q.name}
                {isDeadLetterQueue(q.name) && <span className="badge-dlq">DLQ</span>}
              </td>
              <td>{q.messages ?? 0}</td>
              <td>{q.durable ? 'sí' : 'no'}</td>
              <td>
                <button onClick={() => handleDelete(q.name)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------------------------- Exchanges

function ExchangesTab({ api, exchanges, onChanged, onError }) {
  const [form, setForm] = useState({ name: '', type: 'DIRECT', durable: true });
  const [creating, setCreating] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    api
      .post('/api/rabbitmq/exchanges', form)
      .then(() => {
        setForm({ name: '', type: 'DIRECT', durable: true });
        onChanged();
      })
      .catch(onError)
      .finally(() => setCreating(false));
  }

  function handleDelete(name) {
    if (!window.confirm(`¿Eliminar el exchange "${name}"? Esta acción no se puede deshacer.`)) return;
    api.delete(`/api/rabbitmq/exchanges/${encodeURIComponent(name)}`).then(onChanged).catch(onError);
  }

  return (
    <div>
      <form className="create-form" onSubmit={handleCreate}>
        <input
          placeholder="Nombre del exchange"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {EXCHANGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={form.durable}
            onChange={(e) => setForm({ ...form, durable: e.target.checked })}
          />
          Durable
        </label>
        <button type="submit" disabled={creating}>
          {creating ? 'Creando…' : 'Crear exchange'}
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Durable</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {exchanges.map((x) => (
            <tr key={x.name}>
              <td>{x.name}</td>
              <td>{x.type}</td>
              <td>{x.durable ? 'sí' : 'no'}</td>
              <td>
                <button onClick={() => handleDelete(x.name)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------- Bindings

function BindingsTab({ api, bindings, onChanged, onError }) {
  const [form, setForm] = useState({ exchange: '', queue: '', routingKey: '' });
  const [creating, setCreating] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    api
      .post('/api/rabbitmq/bindings', form)
      .then(() => {
        setForm({ exchange: '', queue: '', routingKey: '' });
        onChanged();
      })
      .catch(onError)
      .finally(() => setCreating(false));
  }

  function handleDelete(binding) {
    const { source: exchange, destination: queue, routing_key: routingKey } = binding;
    if (!window.confirm(`¿Eliminar el binding "${exchange}" → "${queue}" (${routingKey})?`)) return;
    api
      .delete('/api/rabbitmq/bindings', { params: { exchange, queue, routingKey } })
      .then(onChanged)
      .catch(onError);
  }

  return (
    <div>
      <form className="create-form" onSubmit={handleCreate}>
        <input
          placeholder="Exchange"
          value={form.exchange}
          onChange={(e) => setForm({ ...form, exchange: e.target.value })}
          required
        />
        <input
          placeholder="Cola"
          value={form.queue}
          onChange={(e) => setForm({ ...form, queue: e.target.value })}
          required
        />
        <input
          placeholder="Routing key (admite # y *)"
          value={form.routingKey}
          onChange={(e) => setForm({ ...form, routingKey: e.target.value })}
          required
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Creando…' : 'Crear binding'}
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Exchange</th>
            <th>Cola</th>
            <th>Routing key</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* */}
          {bindings
            .filter((b) => b.destination_type === 'queue')
            .map((b, i) => (
              <tr key={`${b.source}-${b.destination}-${b.routing_key}-${i}`}>
                <td>{b.source || '(default)'}</td>
                <td>{b.destination}</td>
                <td>{b.routing_key}</td>
                <td>
                  <button onClick={() => handleDelete(b)}>Eliminar</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
