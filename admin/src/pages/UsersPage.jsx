import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [courierForm, setCourierForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await adminAPI.getUsers(roleFilter || undefined);
    setUsers(data);
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id) => {
    await adminAPI.toggleUser(id);
    load();
  };

  const handleAddCourier = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createCourier(courierForm);
      setShowAddCourier(false);
      setCourierForm({ name: '', email: '', password: '', phone: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (e) => setCourierForm((f) => ({ ...f, [key]: e.target.value }));

  const ROLE_FILTERS = [
    { value: '',         label: 'Все' },
    { value: 'customer', label: 'Покупатели' },
    { value: 'courier',  label: 'Курьеры' },
    { value: 'admin',    label: 'Администраторы' },
  ];

  const ROLE_LABELS = {
    admin: { text: 'Администратор', cls: 'bg-purple-100 text-purple-700' },
    courier: { text: 'Курьер', cls: 'bg-blue-100 text-blue-700' },
    customer: { text: 'Покупатель', cls: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Пользователи ({users.length})</h2>
        <button onClick={() => setShowAddCourier(true)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Добавить курьера
        </button>
      </div>

      <div className="flex gap-2">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${roleFilter === r.value ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Загрузка...</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Роль</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Дата регистрации</th>
                <th className="px-4 py-3 text-left">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const role = ROLE_LABELS[u.role] || { text: u.role, cls: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${role.cls}`}>{role.text}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => handleToggle(u.id)} className={`text-xs font-medium ${u.is_active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                          {u.is_active ? 'Заблокировать' : 'Активировать'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddCourier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">Добавить курьера</h3>
              <button onClick={() => setShowAddCourier(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddCourier} className="p-5 space-y-3">
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Имя*" value={courierForm.name} onChange={setField('name')} required />
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email*" value={courierForm.email} onChange={setField('email')} required />
              <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Пароль* (мин. 6 символов)" value={courierForm.password} onChange={setField('password')} required minLength={6} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Телефон" value={courierForm.phone} onChange={setField('phone')} />
              <button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Создать курьера'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
