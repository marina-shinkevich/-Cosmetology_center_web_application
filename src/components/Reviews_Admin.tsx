import React, { useState, useEffect } from "react";
import "../CSS/Reviews_Admin.css";
import AdminSidebar from "./AdminSidebar";
import { apiGet, apiDelete } from "../utils/api";

interface Review {
  RevID: number;
  UserID: number;
  Text: string;
  UserName: string;
}

const Reviews_Admin: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    apiGet<Review[]>('/api/reviews')
      .then(data => setReviews(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/admin/reviews/delete/${id}`);
      setReviews(prev => prev.filter(r => r.RevID !== id));
    } catch { }
  };

  return (
    <div className="admin-container">
      <AdminSidebar active="reviews" />
      <main className="admin-content">
        <header className="content-header">
          <h1>Управление отзывами клиентов</h1>
        </header>
        {loading ? (
          <p style={{ color: '#c8a84b', padding: '20px' }}>Загрузка...</p>
        ) : (
          <div className="reviews-table-container">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Клиент</th>
                  <th>Текст отзыва</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Отзывов нет</td></tr>
                ) : reviews.map(r => (
                  <tr key={r.RevID}>
                    <td><span className="review-id">{r.RevID}</span></td>
                    <td>{r.UserName}</td>
                    <td style={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.Text}</td>
                    <td className="actions-cell1">
                      <div className="default-actions">
                        <button className="delete-btn" onClick={() => handleDelete(r.RevID)}>Удалить</button>
                      </div>
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

export default Reviews_Admin;
