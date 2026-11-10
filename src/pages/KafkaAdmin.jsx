import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import TopicsTab from './kafka/TopicsTab';
import GroupsTab from './kafka/GroupsTab';

/**
 * Administración de Kafka (plan Kafka, tarea 4.9). Solo rol Admin.
 * Todas las llamadas van al BFF (/api/kafka/...), que reenvía a ms-rutaexpress-kafka-admin.
 *
 *  - Tópicos (kafka/TopicsTab, kafka/EditTopicPanel): crear, editar retención y cleanup.policy,
 *    aumentar particiones, eliminar.
 *  - Consumer groups (kafka/GroupsTab, kafka/GroupRows): estado, miembros y lag por partición,
 *    refresco cada 5 s, reseteo de offsets y eliminación.
 */

const TABS = [
  { key: 'topics', label: 'Tópicos' },
  { key: 'groups', label: 'Consumer groups' },
];

export default function KafkaAdmin() {
  const api = useApi();
  const [tab, setTab] = useState('topics');

  return (
    <div className="page">
      <h1>Administración de Kafka</h1>

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

      {tab === 'topics' && <TopicsTab api={api} />}
      {tab === 'groups' && <GroupsTab api={api} />}
    </div>
  );
}
