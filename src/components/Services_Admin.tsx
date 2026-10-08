import React, { useState, useEffect } from 'react';
import '../CSS/Services_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPut, apiDelete, apiPostForm } from '../utils/api';

interface Service {
  ServiceID: number;
  ServiceName: string;
  Description: string;
  CategoryID: number | null;
  CategoryName: string;
  Price: number;
  DurationMinutes: number;
  IsActive: number;
}

interface Category { CategoryID: number; CategoryName: string; IsActive: number; }

const Services_Admin: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedService, setEditedService] = useState<Service | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, Service>>(new Map());
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState({ ServiceName:'', Description:'', CategoryID:'' as string|number, Price:0, DurationMinutes:0, Indications:'', Effect:'' });
  const [newServicePhoto, setNewServicePhoto] = useState<File | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadAll = () => Promise.all([
    apiGet<{ success: boolean; services: Service[] }>('/api/admin/services-list'),
    apiGet<{ success: boolean; categories: Category[] }>('/api/admin/categories'),
  ]).then(([sd, cd]) => {
    setServices(sd.services || []);
    setCategories(cd.categories || []);
  }).finally(() => setLoading(false));

  useEffect(() => { loadAll(); }, []);

  const activeCategories = categories.filter(c => c.IsActive);

  const handleAdd = async () => {
    if (!newService.ServiceName.trim()) { return; }
    try {
      const fd = new FormData();
      fd.append('ServiceName', newService.ServiceName);
      fd.append('Description', newService.Description);
      fd.append('CategoryID', String(newService.CategoryID || ''));
      fd.append('Price', String(newService.Price));
      fd.append('DurationMinutes', String(newService.DurationMinutes));
      fd.append('Indications', newService.Indications);
      fd.append('Effect', newService.Effect);
      if (newServicePhoto) fd.append('photo', newServicePhoto);
      await apiPostForm('/api/admin/services/add', fd);
      await loadAll();
      setNewService({ ServiceName:'', Description:'', CategoryID:'', Price:0, DurationMinutes:0, Indications:'', Effect:'' });
      setNewServicePhoto(null);
    } catch { }
  };

  const handleSaveRow = (id: number) => {
    if (!editedService) return;
    const cat = categories.find(c => c.CategoryID === editedService.CategoryID);
    const updated = { ...editedService, CategoryName: cat?.CategoryName || '' };
    setServices(services.map(s => s.ServiceID === id ? updated : s));
    setPendingChanges(prev => new Map(prev).set(id, updated));
    setEditingId(null); setEditedService(null);
  };

  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;
    setSaving(true);
    try {
      for (const svc of Array.from(pendingChanges.values())) {
        await apiPut('/api/admin/services/update', svc);
      }
      setPendingChanges(new Map());
    } catch { }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (svc: Service) => {
    try {
      if (svc.IsActive) {
        await apiDelete(`/api/admin/services/delete/${svc.ServiceID}`);
        await loadAll();
      } else {
        if (!svc.CategoryID) {
          return;
        }
        const cat = categories.find(c => c.CategoryID === svc.CategoryID);
        if (!cat?.IsActive) {
          return;
        }
        const res = await apiPut<{success:boolean;message?:string}>(`/api/admin/services/activate/${svc.ServiceID}`, {});
        if (!res.success) { return; }
        await loadAll();
      }
    } catch { }
  };

  const f = (field: keyof Service, val: string|number|null) => editedService && setEditedService({ ...editedService, [field]: val });
  const fn = (field: keyof typeof newService, val: string|number) => setNewService(p => ({ ...p, [field]: val }));

  const activeServices   = services.filter(s => s.IsActive);
  const inactiveServices = services.filter(s => !s.IsActive);

  const CategorySelect: React.FC<{ value: number|null; onChange: (v: number|null) => void; className?: string }> = ({ value, onChange, className }) => (
    <select className={className || 'edit-input'} value={value || ''} onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}>
      <option value="">— Без категории —</option>
      {activeCategories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
    </select>
  );

  return (
    <div className="admin-container">
      <AdminSidebar active="services" />
      <main className="admin-content">
        <header className="content-header">
          <h1>Управление процедурами</h1>
          {pendingChanges.size > 0 && (
            <button className="save-all-btn" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Сохранение...' : `Сохранить изменения (${pendingChanges.size})`}
            </button>
          )}
        </header>

        <div className="add-service-panel">
          <h2>Добавить процедуру</h2>
          <div className="add-service-form">
            <div className="form-row11">
              <div className="form-group11">
                <label>Название *</label>
                <input className="form-input11" value={newService.ServiceName} onChange={e=>fn('ServiceName',e.target.value)} placeholder="Название процедуры" />
              </div>
              <div className="form-group11">
                <label>Категория</label>
                <select className="form-input11" value={newService.CategoryID} onChange={e=>fn('CategoryID',e.target.value)}>
                  <option value="">— Без категории —</option>
                  {activeCategories.map(c=><option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group11">
              <label>Описание</label>
              <textarea className="form-input11 form-textarea11" rows={2} value={newService.Description} onChange={e=>fn('Description',e.target.value)} />
            </div>
            <div className="form-row11">
              <div className="form-group11">
                <label>Цена (BYN)</label>
                <input type="number" className="form-input11" value={newService.Price} onChange={e=>fn('Price',parseFloat(e.target.value)||0)} min="0" />
              </div>
              <div className="form-group11">
                <label>Длительность (мин)</label>
                <input type="number" className="form-input11" value={newService.DurationMinutes} onChange={e=>fn('DurationMinutes',parseInt(e.target.value)||0)} min="0" />
              </div>
            </div>
            <div className="form-group11">
              <label>Фото процедуры</label>
              <input type="file" accept="image/*" className="form-input11" onChange={e => setNewServicePhoto(e.target.files?.[0] || null)} />
              {newServicePhoto && <span style={{fontSize:'12px',color:'#5a7a68',marginTop:'4px',display:'block'}}>Выбрано: {newServicePhoto.name}</span>}
            </div>
            <button className="add-service-btn" onClick={handleAdd}>Добавить</button>
          </div>
        </div>

        {loading ? <p style={{padding:'20px'}}>Загрузка...</p> : (
          <>
            <div className="services-table-container">
              <h2>Активные процедуры ({activeServices.length})</h2>
              <table className="services-table">
                <thead><tr><th>ID</th><th>Название</th><th>Категория</th><th>Цена</th><th>Мин</th><th>Описание</th><th>Действия</th></tr></thead>
                <tbody>
                  {activeServices.map(s => (
                    <tr key={s.ServiceID} style={pendingChanges.has(s.ServiceID) ? {background:'#fffbe8'} : {}}>
                      <td>{s.ServiceID}</td>
                      <td>{editingId===s.ServiceID ? <input className="edit-input" value={editedService?.ServiceName||''} onChange={e=>f('ServiceName',e.target.value)}/> : s.ServiceName}</td>
                      <td>{editingId===s.ServiceID
                        ? <CategorySelect value={editedService?.CategoryID||null} onChange={v=>f('CategoryID',v)} />
                        : s.CategoryName || <span style={{color:'#aaa'}}>—</span>}
                      </td>
                      <td>{editingId===s.ServiceID ? <input type="number" className="edit-input" value={editedService?.Price||0} onChange={e=>f('Price',parseFloat(e.target.value))}/> : `${s.Price} BYN`}</td>
                      <td>{editingId===s.ServiceID ? <input type="number" className="edit-input" value={editedService?.DurationMinutes||0} onChange={e=>f('DurationMinutes',parseInt(e.target.value))}/> : s.DurationMinutes}</td>
                      <td><span title={s.Description}>{(s.Description||'').substring(0,40)}{(s.Description||'').length>40?'...':''}</span></td>
                      <td className="actions-cell">
                        {editingId===s.ServiceID ? (
                          <div className="edit-actions">
                            <button className="save-btn" onClick={()=>handleSaveRow(s.ServiceID)}>✓</button>
                            <button className="cancel-btn" onClick={()=>{setEditingId(null);setEditedService(null);}}>✕</button>
                          </div>
                        ) : (
                          <div className="default-actions">
                            <button className="edit-btn" onClick={()=>{setEditingId(s.ServiceID);setEditedService({...s});}}>Редактировать</button>
                            <button className="delete-btn" onClick={()=>handleToggleActive(s)}>Деактивировать</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inactiveServices.length > 0 && (
              <div className="services-table-container" style={{marginTop:'24px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <h2 style={{color:'#8c3a3a',margin:0}}>Неактивные процедуры ({inactiveServices.length})</h2>
                  <button className="edit-btn" onClick={()=>setShowInactive(v=>!v)}>
                    {showInactive ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
                {showInactive && (
                  <table className="services-table">
                    <thead><tr><th>ID</th><th>Название</th><th>Категория</th><th>Цена</th><th>Мин</th><th>Действия</th></tr></thead>
                    <tbody>
                      {inactiveServices.map(s => (
                        <tr key={s.ServiceID} style={{opacity:0.6}}>
                          <td>{s.ServiceID}</td>
                          <td>{editingId===s.ServiceID ? <input className="edit-input" value={editedService?.ServiceName||''} onChange={e=>f('ServiceName',e.target.value)}/> : s.ServiceName}</td>
                          <td>{editingId===s.ServiceID
                            ? <CategorySelect value={editedService?.CategoryID||null} onChange={v=>f('CategoryID',v)} />
                            : s.CategoryName || <span style={{color:'#aaa'}}>—</span>}
                          </td>
                          <td>{s.Price} BYN</td>
                          <td>{s.DurationMinutes}</td>
                          <td className="actions-cell">
                            {editingId===s.ServiceID ? (
                              <div className="edit-actions">
                                <button className="save-btn" onClick={()=>handleSaveRow(s.ServiceID)}>✓ Сохранить</button>
                                <button className="save-btn" style={{background:'#2a6e3a',padding:'6px 10px'}} onClick={async()=>{
                                  if (!editedService?.CategoryID) { return; }
                                  const cat = categories.find(c => c.CategoryID === editedService.CategoryID);
                                  if (!cat?.IsActive) { return; }
                                  try {
                                    const toSave = { ...editedService, CategoryID: editedService.CategoryID ? Number(editedService.CategoryID) : null };
                                    await apiPut('/api/admin/services/update', toSave);
                                    const res = await apiPut<{success:boolean;message?:string}>(`/api/admin/services/activate/${s.ServiceID}`, {});
                                    if (!res.success) { return; }
                                    setEditingId(null); setEditedService(null);
                                    await loadAll();
                                  } catch(e:any) { }
                                }}>✓ Активировать</button>
                                <button className="cancel-btn" onClick={()=>{setEditingId(null);setEditedService(null);}}>✕</button>
                              </div>
                            ) : (
                              <div className="default-actions">
                                <button className="edit-btn" onClick={()=>{setEditingId(s.ServiceID);setEditedService({...s});}}>Выбрать категорию</button>
                                <button className="save-btn" style={{padding:'6px 12px'}} onClick={()=>handleToggleActive(s)}>Активировать</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Services_Admin;
