import React, { useState, useEffect } from 'react';
import '../CSS/Services_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPost, apiPut } from '../utils/api';

interface Category { CategoryID: number; CategoryName: string; IsActive: number; }

const Categories_Admin: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [newName, setNewName] = useState('');

  const load = () => apiGet<{ success: boolean; categories: Category[] }>('/api/admin/categories')
    .then(d => setCategories(d.categories || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { return; }
    try {
      await apiPost('/api/admin/categories/add', { CategoryName: newName.trim() });
      await load();
      setNewName('');
    } catch { }
  };

  const handleSave = async (id: number) => {
    if (!editedName.trim()) return;
    try {
      await apiPut('/api/admin/categories/update', { CategoryID: id, CategoryName: editedName.trim() });
      setCategories(categories.map(c => c.CategoryID === id ? { ...c, CategoryName: editedName.trim() } : c));
      setEditingId(null);
    } catch { }
  };

  const handleDeactivate = async (id: number, name: string) => {
    try {
      await apiPut(`/api/admin/categories/deactivate/${id}`, {});
      await load();
    } catch { }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiPut(`/api/admin/categories/activate/${id}`, {});
      await load();
    } catch { }
  };

  const active   = categories.filter(c => c.IsActive);
  const inactive = categories.filter(c => !c.IsActive);

  return (
    <div className="admin-container">
      <AdminSidebar active="categories" />
      <main className="admin-content">
        <header className="content-header"><h1>Управление категориями процедур</h1></header>

        <div className="add-service-panel">
          <h2>Добавить категорию</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group11" style={{ flex: 1 }}>
              <label>Название *</label>
              <input className="form-input11" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Название категории" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
            <button className="add-service-btn" onClick={handleAdd}>Добавить</button>
          </div>
        </div>

        {loading ? <p style={{ padding: '20px' }}>Загрузка...</p> : (
          <>
            <div className="services-table-container" style={{ maxWidth: '600px' }}>
              <h2>Активные категории</h2>
              <table className="services-table">
                <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
                <tbody>
                  {active.map(c => (
                    <tr key={c.CategoryID}>
                      <td>{c.CategoryID}</td>
                      <td>{editingId === c.CategoryID
                        ? <input className="edit-input" value={editedName} onChange={e => setEditedName(e.target.value)} autoFocus />
                        : c.CategoryName}
                      </td>
                      <td className="actions-cell">
                        {editingId === c.CategoryID ? (
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => handleSave(c.CategoryID)}>✓</button>
                            <button className="cancel-btn" onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        ) : (
                          <div className="default-actions">
                            <button className="edit-btn" onClick={() => { setEditingId(c.CategoryID); setEditedName(c.CategoryName); }}>Редактировать</button>
                            <button className="delete-btn" onClick={() => handleDeactivate(c.CategoryID, c.CategoryName)}>Деактивировать</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {active.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Нет активных категорий</td></tr>}
                </tbody>
              </table>
            </div>

            {inactive.length > 0 && (
              <div className="services-table-container" style={{ marginTop: '24px', maxWidth: '600px' }}>
                <h2 style={{ color: '#8c3a3a' }}>Неактивные категории</h2>
                <table className="services-table">
                  <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
                  <tbody>
                    {inactive.map(c => (
                      <tr key={c.CategoryID} style={{ opacity: 0.6 }}>
                        <td>{c.CategoryID}</td>
                        <td>{editingId === c.CategoryID
                          ? <input className="edit-input" value={editedName} onChange={e => setEditedName(e.target.value)} autoFocus />
                          : c.CategoryName}
                        </td>
                        <td className="actions-cell">
                          {editingId === c.CategoryID ? (
                            <div className="edit-actions">
                              <button className="save-btn" onClick={() => handleSave(c.CategoryID)}>✓</button>
                              <button className="cancel-btn" onClick={() => setEditingId(null)}>✕</button>
                            </div>
                          ) : (
                            <div className="default-actions">
                              <button className="edit-btn" onClick={() => { setEditingId(c.CategoryID); setEditedName(c.CategoryName); }}>Переименовать</button>
                              <button className="save-btn" style={{ padding: '6px 12px' }} onClick={() => handleActivate(c.CategoryID)}>Активировать</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Categories_Admin;
