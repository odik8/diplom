import React, { useEffect, useState, useCallback } from 'react';
import { orderAPI, adminAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['', 'pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  '': 'Все', pending: 'Ожидает', confirmed: 'Принят', preparing: 'Готовится',
  ready: 'Готов', picked_up: 'В пути', delivered: 'Доставлен', cancelled: 'Отменён',
};
const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
  ready: 'picked_up', picked_up: 'delivered',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [assignCourier, setAssignCourier] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ status: statusFilter || undefined, page, limit: 15 });
      setOrders(data.orders);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { adminAPI.getUsers('courier').then(({ data }) => setCouriers(data)); }, []);

  const updateStatus = async (orderId, status, courierId) => {
    await orderAPI.updateStatus(orderId, { status, courier_id: courierId || undefined });
    load();
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Заказы ({total})</h2>
        <button onClick={load} className="text-sm text-orange-500 hover:text-orange-700">↻ Обновить</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">№</th>
                <th className="px-4 py-3 text-left">Клиент</th>
                <th className="px-4 py-3 text-left">Адрес</th>
                <th className="px-4 py-3 text-left">Сумма</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Курьер</th>
                <th className="px-4 py-3 text-left">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Заказов нет</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-gray-400">{o.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{o.delivery_address}</td>
                  <td className="px-4 py-3 font-semibold text-orange-600">{Number(o.total_price).toFixed(2)} ₽</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{o.courier_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(o); setAssignCourier(o.courier_id || ''); }}
                      className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Управлять
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-2">
        {Array.from({ length: Math.ceil(total / 15) }, (_, i) => i + 1).map((p) => (
          <button
            key={p} onClick={() => setPage(p)}
            className={`w-8 h-8 rounded text-sm ${page === p ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Заказ #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Текущий статус</p>
                <StatusBadge status={selected.status} />
              </div>

              {!['delivered', 'cancelled'].includes(selected.status) && (
                <>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Назначить курьера</label>
                    <select
                      value={assignCourier}
                      onChange={(e) => setAssignCourier(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">— не назначен —</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {NEXT_STATUS[selected.status] && (
                    <button
                      onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status], assignCourier)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm"
                    >
                      Перевести → {STATUS_LABELS[NEXT_STATUS[selected.status]]}
                    </button>
                  )}

                  <button
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                    className="w-full border border-red-300 text-red-500 hover:bg-red-50 font-medium py-2 rounded-lg text-sm"
                  >
                    Отменить заказ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
