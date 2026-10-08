import React, { useState, useEffect } from 'react';
import '../CSS/Specialists_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from '../utils/api';

interface Specialist {
  SpecialistID: number;
  LastName: string;
  FirstName: string;
  Phone: string;
  Email: string;
  Experience: number;
  SpecDescription: string;
  Education: string;
}

const Specialists_Admin: React.FC = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedSpec, setEditedSpec] = useState<Specialist | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, Specialist>>(new Map());
  const [saving, setSaving] = useState(false);
  const [newSpec, setNewSpec] = useState({ LastName:'', FirstName:'', Login:'', Phone:'', Email:'', PasswordHash:'', Experience:0, SpecDescription:'', Education:'' });
  const [newSpecPhoto, setNewSpecPhoto] = useState<File | null>(null);

  const load = () => apiGet<{ success: boolean; specialists: Specialist[] }>('/api/admin/specialists')
    .then(d => setSpecialists(d.specialists || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newSpec.LastName.trim() || !newSpec.FirstName.trim() || !newSpec.Login.trim()) {
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(newSpec).forEach(([k, v]) => fd.append(k, String(v)));
      if (newSpecPhoto) fd.append('photo', newSpecPhoto);
      await apiPostForm('/api/admin/specialists/add', fd);
      await load();
      setNewSpec({ LastName:'', FirstName:'', Login:'', Phone:'', Email:'', PasswordHash:'', Experience:0, SpecDescription:'', Education:'' });
      setNewSpecPhoto(null);
    } catch { }
  };

  const handleSaveRow = (id: number) => {
    if (!editedSpec) return;
    setSpecialists(specialists.map(s => s.SpecialistID === id ? editedSpec : s));
    setPendingChanges(prev => new Map(prev).set(id, editedSpec));
    setEditingId(null); setEditedSpec(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      for (const spec of Array.from(pendingChanges.values())) {
        await apiPut('/api/admin/specialists/update', spec);
      }
      setPendingChanges(new Map());
    } catch { }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/admin/specialists/delete/${id}`);
      setSpecialists(specialists.filter(s => s.SpecialistID !== id));
      setPendingChanges(prev => { const m = new Map(prev); m.delete(id); return m; });
    } catch { }
  };

  const f = (field: keyof Specialist, val: string|number) => editedSpec && setEditedSpec({ ...editedSpec, [field]: val });
  const fn = (field: keyof typeof newSpec, val: string|number) => setNewSpec(p => ({ ...p, [field]: val }));

  return (
    <div className="admin-container">
      <AdminSidebar active="specialists" />
      <main className="admin-content">
        <header className="content-header">
          <h1>Управление специалистами</h1>
          {pendingChanges.size > 0 && (
            <button className="save-all-btn" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Сохранение...' : `Сохранить изменения (${pendingChanges.size})`}
            </button>
          )}
        </header>

        <div className="add-specialist-panel">
          <h2>Добавить специалиста</h2>
          <div className="add-specialist-form">
            <div className="form-row7">
              <div className="form-group7"><label>Фамилия *</label><input className="form-input7" value={newSpec.LastName} onChange={e=>fn('LastName',e.target.value)} /></div>
              <div className="form-group7"><label>Имя *</label><input className="form-input7" value={newSpec.FirstName} onChange={e=>fn('FirstName',e.target.value)} /></div>
            </div>
            <div className="form-row7">
              <div className="form-group7"><label>Логин *</label><input className="form-input7" value={newSpec.Login} onChange={e=>fn('Login',e.target.value)} /></div>
              <div className="form-group7"><label>Пароль</label><input type="password" className="form-input7" value={newSpec.PasswordHash} onChange={e=>fn('PasswordHash',e.target.value)} placeholder="Временный пароль" /></div>
            </div>
            <div className="form-row7">
              <div className="form-group7"><label>Телефон</label><input className="form-input7" value={newSpec.Phone} onChange={e=>fn('Phone',e.target.value)} /></div>
              <div className="form-group7"><label>Email</label><input type="email" className="form-input7" value={newSpec.Email} onChange={e=>fn('Email',e.target.value)} /></div>
            </div>
            <div className="form-row7">
              <div className="form-group7"><label>Опыт (лет)</label><input type="number" className="form-input7" value={newSpec.Experience} onChange={e=>fn('Experience',parseInt(e.target.value)||0)} min="0" /></div>
              <div className="form-group7"><label>Описание</label><input className="form-input7" value={newSpec.SpecDescription} onChange={e=>fn('SpecDescription',e.target.value)} /></div>
            </div>
            <div className="form-row7">
              <div className="form-group7 full-width">
                <label>Образование</label>
                <input className="form-input7" value={newSpec.Education} onChange={e=>fn('Education',e.target.value)} placeholder="Учебное заведение, специальность" />
              </div>
            </div>
            <div className="form-row7">
              <div className="form-group7 full-width">
                <label>Фото специалиста</label>
                <input type="file" accept="image/*" className="form-input7" onChange={e => setNewSpecPhoto(e.target.files?.[0] || null)} />
                {newSpecPhoto && <span style={{fontSize:'12px',color:'#5a7a68'}}>Выбрано: {newSpecPhoto.name}</span>}
              </div>
            </div>
            <button className="add-specialist-btn" onClick={handleAdd}>Добавить</button>          </div>
        </div>

        {loading ? <p style={{padding:'20px'}}>Загрузка...</p> : (
          <div className="specialists-table-container">
            <h2>Существующие специалисты</h2>
            <table className="specialists-table">
              <thead><tr><th>ID</th><th>Фамилия</th><th>Имя</th><th>Телефон</th><th>Email</th><th>Опыт</th><th>Образование</th><th>Описание</th><th>Действия</th></tr></thead>
              <tbody>
                {specialists.map(s => (
                  <tr key={s.SpecialistID} style={pendingChanges.has(s.SpecialistID) ? {background:'#fffbe8'} : {}}>
                    <td>{s.SpecialistID}</td>
                    <td>{editingId===s.SpecialistID ? <input className="edit-input" value={editedSpec?.LastName||''} onChange={e=>f('LastName',e.target.value)}/> : s.LastName}</td>
                    <td>{editingId===s.SpecialistID ? <input className="edit-input" value={editedSpec?.FirstName||''} onChange={e=>f('FirstName',e.target.value)}/> : s.FirstName}</td>
                    <td>{editingId===s.SpecialistID ? <input className="edit-input" value={editedSpec?.Phone||''} onChange={e=>f('Phone',e.target.value)}/> : s.Phone}</td>
                    <td>{editingId===s.SpecialistID ? <input className="edit-input" value={editedSpec?.Email||''} onChange={e=>f('Email',e.target.value)}/> : s.Email}</td>
                    <td>{editingId===s.SpecialistID ? <input type="number" className="edit-input" value={editedSpec?.Experience||0} onChange={e=>f('Experience',parseInt(e.target.value))}/> : `${s.Experience} лет`}</td>
                    <td>{editingId===s.SpecialistID
                      ? <input className="edit-input" value={editedSpec?.Education||''} onChange={e=>f('Education',e.target.value)}/>
                      : <span title={s.Education}>{(s.Education||'').substring(0,40)}{(s.Education||'').length>40?'...':''}</span>}
                    </td>
                    <td>{editingId===s.SpecialistID
                      ? <textarea className="edit-input" rows={2} style={{width:'100%', resize:'none', boxSizing:'border-box'}} value={editedSpec?.SpecDescription||''} onChange={e=>f('SpecDescription',e.target.value)}/>
                      : <span title={s.SpecDescription}>{(s.SpecDescription||'').substring(0,40)}{(s.SpecDescription||'').length>40?'...':''}</span>}
                    </td>
                    <td className="actions-cell">
                      {editingId===s.SpecialistID ? (
                        <div className="edit-actions">
                          <button className="save-btn" onClick={()=>handleSaveRow(s.SpecialistID)} title="Применить">✓</button>
                          <button className="cancel-btn" onClick={()=>{setEditingId(null);setEditedSpec(null);}}>✕</button>
                        </div>
                      ) : (
                        <div className="default-actions">
                          <button className="edit-btn" onClick={()=>{setEditingId(s.SpecialistID);setEditedSpec({...s});}}>Редактировать</button>
                          <button className="delete-btn" onClick={()=>handleDelete(s.SpecialistID)}>Удалить</button>
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

export default Specialists_Admin;
