const STATUS_MAP = {
  pending:   { label: 'Ожидает',         cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Принят',          cls: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Готовится',       cls: 'bg-orange-100 text-orange-700' },
  ready:     { label: 'Готов',           cls: 'bg-purple-100 text-purple-700' },
  picked_up: { label: 'В пути',          cls: 'bg-cyan-100 text-cyan-700' },
  delivered: { label: 'Доставлен',       cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменён',         cls: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}
