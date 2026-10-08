import React, { useState, useEffect } from 'react';
import '../CSS/SpecProc_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPost, apiDelete } from '../utils/api';

interface Relation {
  SpecialistID: number;
  ServiceID: number;
  SpecialistName: string;
  ServiceName: string;
}
interface SpecOption { SpecialistID: number; LastName: string; FirstName: string; }
interface SvcOption { ServiceID: number; ServiceName: string; }

const SpecProc_Admin: React.FC = () => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [specialists, setSpecialists] = useState<SpecOption[]>([]);
  const [services, setServices] = useState<SvcOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSpecId, setNewSpecId] = useState<number|''>('');
  const [newSvcId, setNewSvcId] = useState<number|''>('');

  const load = () => Promise.all([
    apiGet<{ success: boolean; relations: Relation[] }>('/api/admin/specproc'),
    apiGet<{ success: boolean; specialists: SpecOption[] }>('/api/admin/specialists'),
    apiGet<{ success: boolean; services: SvcOption[] }>('/api/admin/services-list'),
  ]).then(([rd, sd, svd]) => {
    setRelations(rd.relations || []);
    setSpecialists(sd.specialists || []);
    setServices(svd.services || []);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (newSpecId==='' || newSvcId==='') { return; }
    try {
      await apiPost('/api/admin/specproc/add', { SpecialistID: newSpecId, ServiceID: newSvcId });
      await load();
      setNewSpecId(''); setNewSvcId('');
    } catch { }
  };

  const handleDelete = async (specId: number, svcId: number, specName: string, svcName: string) => {
    try {
      await apiPost('/api/admin/specproc/delete', { SpecialistID: specId, ServiceID: svcId });
      setRelations(relations.filter(r => !(r.SpecialistID===specId && r.ServiceID===svcId)));
    } catch { }
  };

  return (
    <div className="admin-container">
      <AdminSidebar active="specproc" />
      <main className="admin-content">
        <header className="content-header"><h1>Связи Мастер — Процедура</h1></header>

        <div className="add-specproc-form">
          <h2>Добавить связь</h2>
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div>
              <label style={{ display:'block', marginBottom:'6px', color:'#c8a84b' }}>Мастер</label>
              <select className="edit-input" value={newSpecId} onChange={e=>setNewSpecId(parseInt(e.target.value)||'')} style={{ minWidth:'220px' }}>
                <option value="">— Выберите мастера —</option>
                {specialists.map(s=><option key={s.SpecialistID} value={s.SpecialistID}>{s.LastName} {s.FirstName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'6px', color:'#c8a84b' }}>Процедура</label>
              <select className="edit-input" value={newSvcId} onChange={e=>setNewSvcId(parseInt(e.target.value)||'')} style={{ minWidth:'220px' }}>
                <option value="">— Выберите процедуру —</option>
                {services.map(s=><option key={s.ServiceID} value={s.ServiceID}>{s.ServiceName}</option>)}
              </select>
            </div>
            <button className="add-service-btn" onClick={handleAdd}>Добавить</button>
          </div>
        </div>

        {loading ? <p style={{color:'#c8a84b',padding:'20px'}}>Загрузка...</p> : (
          <table className="specproc-table">
            <thead><tr><th>Мастер</th><th>Процедура</th><th>Действия</th></tr></thead>
            <tbody>
              {relations.map((r, i) => (
                <tr key={i}>
                  <td>{r.SpecialistName}</td>
                  <td>{r.ServiceName}</td>
                  <td>
                    <button className="delete-btn" onClick={()=>handleDelete(r.SpecialistID, r.ServiceID, r.SpecialistName, r.ServiceName)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default SpecProc_Admin;
