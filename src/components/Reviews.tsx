import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import '../CSS/Reviews.css';
import '../CSS/Keyframes.css';
import { apiGet, apiPost } from '../utils/api';

interface Review {
  RevID: number;
  Text: string;
  UserName: string;
}

const maxDots = 3;

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [loading, setLoading] = useState(true);

  const sessionUser = (() => { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    apiGet<Review[]>('/api/reviews')
      .then(data => { setReviews(data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startIndex = Math.floor(currentReviewIndex / maxDots) * maxDots;
  const visibleDots = reviews.slice(startIndex, startIndex + maxDots);

  const nextReview = () => setCurrentReviewIndex(prev => (prev === reviews.length - 1 ? 0 : prev + 1));
  const prevReview = () => setCurrentReviewIndex(prev => (prev === 0 ? reviews.length - 1 : prev - 1));

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) return;
    if (!sessionUser) { alert('Войдите в аккаунт, чтобы оставить отзыв'); return; }
    try {
      await apiPost('/api/reviews', { userId: sessionUser.UserID, text: newReviewText.trim() });
      const updated = await apiGet<Review[]>('/api/reviews');
      setReviews(updated || []);
      setCurrentReviewIndex((updated?.length ?? 1) - 1);
      setNewReviewText('');
      alert('Спасибо за ваш отзыв!');
    } catch {
      alert('Ошибка при отправке отзыва');
    }
  };

  const currentReview = reviews[currentReviewIndex];

  return (
    <div className="reviews-container">
      <div className="reviews-slider">
        {loading ? (
          <p style={{ color: '#fff' }}>Загрузка...</p>
        ) : reviews.length > 0 && currentReview ? (
          <>
            <div className="slider-content">
              <button className="nav-button prev-button" onClick={prevReview}>
                <svg width="34" height="47" viewBox="0 0 64 57" fill="none"><path d="M2.10749 29.7432C1.34995 30.0785 0.464027 29.7362 0.128724 28.9787C-0.20658 28.2212 0.135713 27.3352 0.893246 26.9999L2.10749 29.7432ZM62.5004 1.37158L63.1075 2.74323L2.10749 29.7432L1.50037 28.3716L0.893246 26.9999L61.8932 -6.09457e-05L62.5004 1.37158Z" fill="#EAC055"/><path d="M0.893243 29.7432C0.135703 29.4079 -0.206583 28.522 0.128721 27.7645C0.464024 27.0069 1.34994 26.6646 2.10748 26.9999L0.893243 29.7432ZM62.5004 55.3716L61.8932 56.7432L0.893243 29.7432L1.50036 28.3716L2.10748 26.9999L63.1075 53.9999L62.5004 55.3716Z" fill="#EAC055"/></svg>
              </button>
              <div className="review-card">
                <div className="review-text">
                  <div className="quote top-quote">"</div>
                  {currentReview.Text}
                  <div className="quote bottom-quote">"</div>
                </div>
                <div className="user-name">{currentReview.UserName}</div>
              </div>
              <button className="nav-button next-button" onClick={nextReview}>
                <svg width="34" height="47" viewBox="0 0 64 57" fill="none"><path d="M61.0001 29.7432C61.7576 30.0785 62.6435 29.7362 62.9788 28.9787C63.3141 28.2212 62.9718 27.3352 62.2143 26.9999L61.0001 29.7432ZM0.607178 1.37158L5.70863e-05 2.74323L61.0001 29.7432L61.6072 28.3716L62.2143 26.9999L1.2143 -6.09457e-05L0.607178 1.37158Z" fill="#EAC055"/><path d="M62.2143 29.7432C62.9718 29.4079 63.3141 28.522 62.9788 27.7645C62.6435 27.0069 61.7576 26.6646 61.0001 26.9999L62.2143 29.7432ZM0.607178 55.3716L1.2143 56.7432L62.2143 29.7432L61.6072 28.3716L61.0001 26.9999L5.70416e-05 53.9999L0.607178 55.3716Z" fill="#EAC055"/></svg>
              </button>
            </div>
            <div className="slider-dots">
              {visibleDots.map((_, idx) => {
                const dotIndex = (startIndex + idx) % reviews.length;
                return (
                  <button key={dotIndex} className={`dot ${dotIndex === currentReviewIndex ? 'active' : ''}`}
                    onClick={() => setCurrentReviewIndex(dotIndex)} />
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ color: '#fff' }}>Отзывов пока нет</p>
        )}
      </div>

      <div className="reviews-form">
        <div className="logo-container">
          <img src="/images/лого.png" alt="Логотип" className="logo" />
        </div>
        <div className="form-content">
          <div className="input-section">
            <textarea
              value={newReviewText}
              onChange={e => setNewReviewText(e.target.value)}
              className="review-textarea"
              placeholder={sessionUser ? "Поделитесь своими впечатлениями..." : "Войдите в аккаунт, чтобы оставить отзыв"}
              rows={6}
              disabled={!sessionUser}
            />
            <div className="buttons-container">
              <button className="submit-button1" onClick={handleSubmitReview} disabled={!sessionUser}>Отправить</button>
              <button className="home-button">
                <Link className="homebt" to="/main">Главная</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
