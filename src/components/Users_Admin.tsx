import React, { useState, useEffect } from 'react';
import '../CSS/Users_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPut, apiDelete } from '../utils/api';

interface User {
  UserID: number;
  LastName: string;
  FirstName: string;
  Login: string;
  Phone: string;
  Email: string;
  PasswordHash: string;
  RoleName: string;
}

const Users_Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, User>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ success: boolean; users: User[] }>('/api/admin/users')
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (u: User) => { setEditingId(u.UserID); setEditedUser({ ...u }); };
  const handleCancel = () => { setEditingId(null); setEditedUser(null); };

  const handleSaveRow = (id: number) => {
    if (!editedUser) return;
    setUsers(users.map(u => u.UserID === id ? editedUser : u));
    setPendingChanges(prev => new Map(prev).set(id, editedUser));
    setEditingId(null);
    setEditedUser(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      for (const user of Array.from(pendingChanges.values())) {
        await apiPut('/api/admin/users/update', user);
      }
      setPendingChanges(new Map());
    } catch { }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/admin/users/delete/${id}`);
      setUsers(users.filter(u => u.UserID !== id));
      setPendingChanges(prev => { const m = new Map(prev); m.delete(id); return m; });
    } catch { }
  };

  const f = (field: keyof User, val: string) => editedUser && setEditedUser({ ...editedUser, [field]: val });

  return (
    <div className="admin-container">
      <AdminSidebar active="users" />
      <main className="admin-content">
        <header className="content-header">
          <h1>Управление пользователями</h1>
          {pendingChanges.size > 0 && (
            <button className="save-all-btn" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Сохранение...' : `Сохранить изменения (${pendingChanges.size})`}
            </button>
          )}
        </header>
        {loading ? <p style={{padding:'20px'}}>Загрузка...</p> : (
          <div className="table-container11">
            <table className="users-table">
              <thead><tr><th>ID</th><th>Фамилия</th><th>Имя</th><th>Логин</th><th>Телефон</th><th>Email</th><th>Роль</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.UserID} style={pendingChanges.has(u.UserID) ? {background:'#fffbe8'} : {}}>
                    <td><span className="user-id">{u.UserID}</span></td>
                    <td>{editingId===u.UserID ? <input className="edit-input" value={editedUser?.LastName||''} onChange={e=>f('LastName',e.target.value)}/> : u.LastName}</td>
                    <td>{editingId===u.UserID ? <input className="edit-input" value={editedUser?.FirstName||''} onChange={e=>f('FirstName',e.target.value)}/> : u.FirstName}</td>
                    <td>{editingId===u.UserID ? <input className="edit-input" value={editedUser?.Login||''} onChange={e=>f('Login',e.target.value)}/> : u.Login}</td>
                    <td>{editingId===u.UserID ? <input className="edit-input" value={editedUser?.Phone||''} onChange={e=>f('Phone',e.target.value)}/> : u.Phone}</td>
                    <td>{editingId===u.UserID ? <input className="edit-input" value={editedUser?.Email||''} onChange={e=>f('Email',e.target.value)}/> : u.Email}</td>
                    <td><span className="user-id">{u.RoleName}</span></td>
                    <td className="actions-cell">
                      {editingId===u.UserID ? (
                        <div className="edit-actions">
                          <button className="save-btn" onClick={()=>handleSaveRow(u.UserID)} title="Применить изменения">✓</button>
                          <button className="cancel-btn" onClick={handleCancel} title="Отменить">✕</button>
                        </div>
                      ) : (
                        <div className="default-actions">
                          <button className="edit-btn" onClick={()=>handleEdit(u)}>Редактировать</button>
                          <button className="delete-btn" onClick={()=>handleDelete(u.UserID)}>Удалить</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Users_Admin;
