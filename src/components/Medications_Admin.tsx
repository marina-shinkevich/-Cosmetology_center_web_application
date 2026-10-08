import React, { useState, useEffect } from 'react';
import '../CSS/Services_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPut, apiDelete, apiPostForm } from '../utils/api';

interface Medication { MedID: number; MedName: string; Description: string; }

const Medications_Admin: React.FC = () => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedMed, setEditedMed] = useState<Medication | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, Medication>>(new Map());
  const [saving, setSaving] = useState(false);
  const [newMed, setNewMed] = useState({ MedName: '', Description: '' });
  const [newMedPhoto, setNewMedPhoto] = useState<File | null>(null);

  const load = () => apiGet<{ success: boolean; medications: Medication[] }>('/api/admin/medications')
    .then(d => setMeds(d.medications || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newMed.MedName.trim()) { return; }
    try {
      const fd = new FormData();
      fd.append('MedName', newMed.MedName);
      fd.append('Description', newMed.Description);
      if (newMedPhoto) fd.append('photo', newMedPhoto);
      await apiPostForm('/api/admin/medications/add', fd);
      await load();
      setNewMed({ MedName: '', Description: '' });
      setNewMedPhoto(null);
    } catch { }
  };

  const handleSaveRow = (id: number) => {
    if (!editedMed) return;
    setMeds(meds.map(m => m.MedID === id ? editedMed : m));
    setPendingChanges(prev => new Map(prev).set(id, editedMed));
    setEditingId(null); setEditedMed(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      for (const med of Array.from(pendingChanges.values())) {
        await apiPut('/api/admin/medications/update', med);
      }
      setPendingChanges(new Map());
    } catch { }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/admin/medications/delete/${id}`);
      setMeds(meds.filter(m => m.MedID !== id));
      setPendingChanges(prev => { const m = new Map(prev); m.delete(id); return m; });
    } catch { }
  };

  return (
    <div className="admin-container">
      <AdminSidebar active="medications" />
      <main className="admin-content">
        <header className="content-header">
          <h1>Управление препаратами</h1>
          {pendingChanges.size > 0 && (
            <button className="save-all-btn" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Сохранение...' : `Сохранить изменения (${pendingChanges.size})`}
            </button>
          )}
        </header>

        <div className="add-service-panel">
          <h2>Добавить препарат</h2>
          <div className="add-service-form">
            <div className="form-row11">
              <div className="form-group11">
                <label>Название *</label>
                <input className="form-input11" value={newMed.MedName} onChange={e => setNewMed(p => ({ ...p, MedName: e.target.value }))} placeholder="Название препарата" />
              </div>
            </div>
            <div className="form-group11">
              <label>Описание</label>
              <textarea className="form-input11 form-textarea11" rows={2} value={newMed.Description} onChange={e => setNewMed(p => ({ ...p, Description: e.target.value }))} />
            </div>
            <div className="form-group11">
              <label>Фото препарата</label>
              <input type="file" accept="image/*" className="form-input11" onChange={e => setNewMedPhoto(e.target.files?.[0] || null)} />
              {newMedPhoto && <span style={{fontSize:'12px',color:'#5a7a68',marginTop:'4px',display:'block'}}>Выбрано: {newMedPhoto.name}</span>}
            </div>
            <button className="add-service-btn" onClick={handleAdd}>Добавить</button>
          </div>
        </div>

        {loading ? <p style={{padding:'20px'}}>Загрузка...</p> : (
          <div className="services-table-container">
            <h2>Список препаратов</h2>
            <table className="services-table">
              <thead><tr><th>ID</th><th>Название</th><th>Описание</th><th>Действия</th></tr></thead>
              <tbody>
                {meds.map(m => (
                  <tr key={m.MedID} style={pendingChanges.has(m.MedID) ? {background:'#fffbe8'} : {}}>
                    <td>{m.MedID}</td>
                    <td>{editingId===m.MedID
                      ? <input className="edit-input" value={editedMed?.MedName||''} onChange={e=>setEditedMed(p=>({...p!,MedName:e.target.value}))}/>
                      : m.MedName}
                    </td>
                    <td>{editingId===m.MedID
                      ? <input className="edit-input" value={editedMed?.Description||''} onChange={e=>setEditedMed(p=>({...p!,Description:e.target.value}))}/>
                      : <span title={m.Description}>{(m.Description||'').substring(0,50)}{(m.Description||'').length>50?'...':''}</span>}
                    </td>
                    <td className="actions-cell">
                      {editingId===m.MedID ? (
                        <div className="edit-actions">
                          <button className="save-btn" onClick={()=>handleSaveRow(m.MedID)} title="Применить">✓</button>
                          <button className="cancel-btn" onClick={()=>{setEditingId(null);setEditedMed(null);}}>✕</button>
                        </div>
                      ) : (
                        <div className="default-actions">
                          <button className="edit-btn" onClick={()=>{setEditingId(m.MedID);setEditedMed({...m});}}>Редактировать</button>
                          <button className="delete-btn" onClick={()=>handleDelete(m.MedID)}>Удалить</button>
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

export default Medications_Admin;
