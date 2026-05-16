import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Дашборд', icon: '📊', end: true },
  { to: '/orders', label: 'Заказы', icon: '📋' },
  { to: '/menu', label: 'Меню', icon: '🍽️' },
  { to: '/users', label: 'Пользователи', icon: '👥' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <span className="text-2xl">🍽️</span>
          {sidebarOpen && <span className="font-bold text-gray-800 text-lg">Администратор</span>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-500' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          {sidebarOpen && <p className="text-xs text-gray-500 mb-2">{user?.name}</p>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 w-full"
          >
            <span>🚪</span>
            {sidebarOpen && 'Выйти'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 text-xl">
            ☰
          </button>
          <h1 className="text-gray-800 font-semibold">Панель управления</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
