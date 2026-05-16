import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI, menuAPI } from '../services/api';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('items');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, itemsRes] = await Promise.all([adminAPI.getCategories(), adminAPI.getMenuItems()]);
    setCategories(catRes.data);
    setItems(itemsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (type, data = {}) => { setModal(type); setForm(data); };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (form.id) await menuAPI.updateItem(form.id, form);
    else await menuAPI.createItem(form);
    setModal(null);
    load();
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (form.id) await menuAPI.updateCategory(form.id, form);
    else await menuAPI.createCategory(form);
    setModal(null);
    load();
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Деактивировать позицию?')) return;
    await menuAPI.deleteItem(id);
    load();
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Меню</h2>
        <div className="flex gap-2">
          <button onClick={() => openModal('category')} className="px-3 py-1.5 border border-orange-400 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50">
            + Категория
          </button>
          <button onClick={() => openModal('item')} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            + Блюдо
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['items', 'categories'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'items' ? 'Блюда' : 'Категории'}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Загрузка...</div> : (
        tab === 'items' ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Блюдо</th>
                  <th className="px-4 py-3 text-left">Категория</th>
                  <th className="px-4 py-3 text-left">Цена</th>
                  <th className="px-4 py-3 text-left">Доступно</th>
                  <th className="px-4 py-3 text-left">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-400 truncate max-w-xs">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-orange-600">{Number(item.price).toFixed(2)} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.is_available ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => openModal('item', item)} className="text-xs text-blue-500 hover:text-blue-700">Ред.</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600">Деакт.</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-gray-400">Порядок: {cat.sort_order}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`w-2 h-2 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                  <button onClick={() => openModal('category', cat)} className="text-xs text-blue-500 hover:text-blue-700">Ред.</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modal === 'item' && (
        <Modal title={form.id ? 'Редактировать блюдо' : 'Новое блюдо'} onClose={() => setModal(null)}>
          <form onSubmit={handleSaveItem} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Название*</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name || ''} onChange={set('name')} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Категория</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category_id || ''} onChange={set('category_id')}>
                  <option value="">— без категории —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Цена (₽)*</label>
                <input type="number" step="0.01" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.price || ''} onChange={set('price')} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Вес (г)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.weight_grams || ''} onChange={set('weight_grams')} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Калории (ккал)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.calories || ''} onChange={set('calories')} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Описание</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.description || ''} onChange={set('description')} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">URL изображения</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.image_url || ''} onChange={set('image_url')} />
              </div>
              {form.id && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Доступно</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.is_available ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.value === 'true' }))}>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm">
              {form.id ? 'Сохранить изменения' : 'Добавить блюдо'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'category' && (
        <Modal title={form.id ? 'Редактировать категорию' : 'Новая категория'} onClose={() => setModal(null)}>
          <form onSubmit={handleSaveCategory} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Название*</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name || ''} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Порядок сортировки</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.sort_order || 0} onChange={set('sort_order')} />
            </div>
            {form.id && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Активна</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}>
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>
            )}
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm">
              {form.id ? 'Сохранить' : 'Создать'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
