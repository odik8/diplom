import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Обзор</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="Всего заказов"      value={stats.total_orders}                          color="bg-blue-50" />
        <StatCard icon="💰" label="Выручка (₽)"        value={Number(stats.total_revenue).toFixed(2)}      color="bg-green-50" />
        <StatCard icon="👥" label="Покупателей"         value={stats.total_customers}                       color="bg-purple-50" />
        <StatCard icon="⏳" label="Активных заказов"   value={stats.pending_orders}                        color="bg-orange-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-3">Быстрые действия</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/orders" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            Просмотреть заказы
          </a>
          <a href="/menu" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Управление меню
          </a>
          <a href="/users" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Пользователи
          </a>
        </div>
      </div>
    </div>
  );
}
