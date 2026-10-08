import React, { useState, useEffect } from 'react';
import '../CSS/Reservations_Admin.css';
import AdminSidebar from './AdminSidebar';
import { apiGet, apiPut, apiDelete } from '../utils/api';

interface Reservation {
  ReservID: number;
  UserID: number;
  UserName: string;
  SpecialistID: number;
  SpecialistName: string;
  ServiceID: number;
  ServiceName: string;
  ReservDate: string;
  ReservTime: string;
  StatusName: string;
  StatusID?: number;
}
interface UserOption { UserID: number; LastName: string; FirstName: string; }
interface SpecOption { SpecialistID: number; LastName: string; FirstName: string; }
interface SvcOption  { ServiceID: number; ServiceName: string; }
interface StatusOption { StatusID: number; StatusName: string; }

const STATUS_COLORS: Record<string, string> = {
  'Отменена': '#8C3A3A',
  'Завершена': '#2a6e3a',
  'Подтверждена': '#1a4a6e',
  'Ожидает': '#7a6a1a',
};

const Reservations_Admin: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [specialists, setSpecialists] = useState<SpecOption[]>([]);
  const [services, setServices] = useState<SvcOption[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editedRes, setEditedRes] = useState<Reservation|null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = (p = 1) => {
    setLoading(true);
    Promise.all([
      apiGet<{ success: boolean; reservations: Reservation[]; totalPages: number }>(`/api/admin/reservations?page=${p}&pageSize=50`),
      apiGet<{ success: boolean; users: UserOption[] }>('/api/admin/users'),
      apiGet<{ success: boolean; specialists: SpecOption[] }>('/api/admin/specialists'),
      apiGet<{ success: boolean; services: SvcOption[] }>('/api/admin/services-list'),
      apiGet<StatusOption[]>('/api/reservation-statuses'),
    ]).then(([rd, ud, sd, svd, st]) => {
      setReservations(rd.reservations || []);
      setTotalPages(rd.totalPages || 1);
      setUsers(ud.users || []);
      setSpecialists(sd.specialists || []);
      setServices(svd.services || []);
      setStatuses(st || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleSave = async (id: number) => {
    if (!editedRes) return;
    try {
      await apiPut('/api/admin/reservations/update', editedRes);
      const user = users.find(u => u.UserID === editedRes.UserID);
      const spec = specialists.find(s => s.SpecialistID === editedRes.SpecialistID);
      const svc  = services.find(s => s.ServiceID === editedRes.ServiceID);
      const status = statuses.find(s => s.StatusID === editedRes.StatusID);
      const updated: Reservation = {
        ...editedRes,
        UserName:       user   ? `${user.LastName} ${user.FirstName}`   : editedRes.UserName,
        SpecialistName: spec   ? `${spec.LastName} ${spec.FirstName}`   : editedRes.SpecialistName,
        ServiceName:    svc    ? svc.ServiceName                        : editedRes.ServiceName,
        StatusName:     status ? status.StatusName                      : editedRes.StatusName,
      };
      setReservations(reservations.map(r => r.ReservID === id ? updated : r));
      setEditingId(null); setEditedRes(null);
    } catch { }
  };

  // Быстрая смена статуса без входа в режим редактирования
  const handleStatusChange = async (reservId: number, statusId: number, statusName: string) => {
    try {
      await apiPut(`/api/admin/reservations/status/${reservId}`, { statusId });
      setReservations(reservations.map(r =>
        r.ReservID === reservId ? { ...r, StatusID: statusId, StatusName: statusName } : r
      ));
    } catch { }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/admin/reservations/delete/${id}`);
      setReservations(reservations.filter(r => r.ReservID !== id));
    } catch { }
  };

  const f = (field: keyof Reservation, val: string|number) => editedRes && setEditedRes({ ...editedRes, [field]: val });

  return (
    <div className="admin-container">
      <AdminSidebar active="reservations" />
      <main className="admin-content">
        <header className="content-header"><h1>Управление записями</h1></header>
        {loading ? <p style={{padding:'20px'}}>Загрузка...</p> : (
          <div className="table-container">
            <table className="reservations-table">
              <thead>
                <tr><th>ID</th><th>Клиент</th><th>Мастер</th><th>Процедура</th><th>Дата</th><th>Время</th><th>Статус</th><th>Действия</th></tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.ReservID}>
                    <td>{r.ReservID}</td>
                    <td>{editingId===r.ReservID ? (
                      <select className="edit-input" value={editedRes?.UserID||''} onChange={e=>f('UserID',parseInt(e.target.value))}>
                        {users.map(u=><option key={u.UserID} value={u.UserID}>{u.LastName} {u.FirstName}</option>)}
                      </select>
                    ) : r.UserName}</td>
                    <td>{editingId===r.ReservID ? (
                      <select className="edit-input" value={editedRes?.SpecialistID||''} onChange={e=>f('SpecialistID',parseInt(e.target.value))}>
                        {specialists.map(s=><option key={s.SpecialistID} value={s.SpecialistID}>{s.LastName} {s.FirstName}</option>)}
                      </select>
                    ) : r.SpecialistName}</td>
                    <td>{editingId===r.ReservID ? (
                      <select className="edit-input" value={editedRes?.ServiceID||''} onChange={e=>f('ServiceID',parseInt(e.target.value))}>
                        {services.map(s=><option key={s.ServiceID} value={s.ServiceID}>{s.ServiceName}</option>)}
                      </select>
                    ) : r.ServiceName}</td>
                    <td>{editingId===r.ReservID ? <input type="date" className="edit-input" value={editedRes?.ReservDate||''} onChange={e=>f('ReservDate',e.target.value)}/> : r.ReservDate}</td>
                    <td>{editingId===r.ReservID ? <input type="time" className="edit-input" value={editedRes?.ReservTime||''} onChange={e=>f('ReservTime',e.target.value)}/> : r.ReservTime}</td>
                    <td>
                      {editingId===r.ReservID ? (
                        <select className="edit-input" value={editedRes?.StatusID||''} onChange={e=>f('StatusID',parseInt(e.target.value))}>
                          {statuses.map(s=><option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>)}
                        </select>
                      ) : (
                        <select
                          className="edit-input"
                          value={r.StatusID || ''}
                          onChange={e => {
                            const sid = parseInt(e.target.value);
                            const sname = statuses.find(s => s.StatusID === sid)?.StatusName || '';
                            handleStatusChange(r.ReservID, sid, sname);
                          }}
                          style={{
                            color: STATUS_COLORS[r.StatusName] || '#1a2e24',
                            fontWeight: 600,
                            minWidth: '150px',
                            paddingRight: '28px',
                          }}
                        >
                          {statuses.map(s=><option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="actions-cell">
                      {editingId===r.ReservID ? (
                        <div className="edit-actions">
                          <button className="save-btn" onClick={()=>handleSave(r.ReservID)}>✓</button>
                          <button className="cancel-btn" onClick={()=>{setEditingId(null);setEditedRes(null);}}>✕</button>
                        </div>
                      ) : (
                        <div className="default-actions">
                          <button className="edit-btn" onClick={()=>{setEditingId(r.ReservID);setEditedRes({...r});}}>Редактировать</button>
                          <button className="delete-btn" onClick={()=>handleDelete(r.ReservID)}>Удалить</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button disabled={page<=1} onClick={()=>setPage(page-1)}>◀ Назад</button>
              <span>Страница {page} из {totalPages}</span>
              <button disabled={page>=totalPages} onClick={()=>setPage(page+1)}>Вперёд ▶</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reservations_Admin;
