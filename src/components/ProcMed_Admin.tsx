import React, { useState, useEffect } from 'react';
import '../CSS/SpecProc_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPost } from '../utils/api';

interface Relation { ProcID: number; MedID: number; ServiceName: string; MedName: string; }
interface SvcOption { ServiceID: number; ServiceName: string; }
interface MedOption { MedID: number; MedName: string; }

const ProcMed_Admin: React.FC = () => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [services, setServices] = useState<SvcOption[]>([]);
  const [medications, setMedications] = useState<MedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProcId, setNewProcId] = useState<number | ''>('');
  const [newMedId, setNewMedId] = useState<number | ''>('');

  const load = () => Promise.all([
    apiGet<{ success: boolean; relations: Relation[] }>('/api/admin/procmed'),
    apiGet<{ success: boolean; services: SvcOption[] }>('/api/admin/services-list'),
    apiGet<{ success: boolean; medications: MedOption[] }>('/api/admin/medications'),
  ]).then(([rd, sd, md]) => {
    setRelations(rd.relations || []);
    setServices(sd.services || []);
    setMedications(md.medications || []);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (newProcId === '' || newMedId === '') { return; }
    try {
      await apiPost('/api/admin/procmed/add', { ProcID: newProcId, MedID: newMedId });
      await load();
      setNewProcId(''); setNewMedId('');
    } catch { }
  };

  const handleDelete = async (procId: number, medId: number, svcName: string, medName: string) => {
    try {
      await apiPost('/api/admin/procmed/delete', { ProcID: procId, MedID: medId });
      setRelations(relations.filter(r => !(r.ProcID === procId && r.MedID === medId)));
    } catch { }
  };

  return (
    <div className="admin-container">
      <AdminSidebar active="procmed" />
      <main className="admin-content">
        <header className="content-header"><h1>Связи Процедура — Препарат</h1></header>

        <div className="add-specproc-form">
          <h2>Добавить связь</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#c8a84b' }}>Процедура</label>
              <select className="edit-input" value={newProcId} onChange={e => setNewProcId(parseInt(e.target.value) || '')} style={{ minWidth: '220px' }}>
                <option value="">— Выберите процедуру —</option>
                {services.map(s => <option key={s.ServiceID} value={s.ServiceID}>{s.ServiceName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#c8a84b' }}>Препарат</label>
              <select className="edit-input" value={newMedId} onChange={e => setNewMedId(parseInt(e.target.value) || '')} style={{ minWidth: '220px' }}>
                <option value="">— Выберите препарат —</option>
                {medications.map(m => <option key={m.MedID} value={m.MedID}>{m.MedName}</option>)}
              </select>
            </div>
            <button className="add-service-btn" onClick={handleAdd}>Добавить</button>
          </div>
        </div>

        {loading ? <p style={{ color: '#c8a84b', padding: '20px' }}>Загрузка...</p> : (
          <table className="specproc-table">
            <thead><tr><th>Процедура</th><th>Препарат</th><th>Действия</th></tr></thead>
            <tbody>
              {relations.map((r, i) => (
                <tr key={i}>
                  <td>{r.ServiceName}</td>
                  <td>{r.MedName}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(r.ProcID, r.MedID, r.ServiceName, r.MedName)}>Удалить</button>
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

export default ProcMed_Admin;
