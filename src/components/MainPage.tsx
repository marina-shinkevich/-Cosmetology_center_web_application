
import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";

import '../CSS/MainPage.css';
import '../CSS/Header.css';
import '../CSS/Keyframes.css';
import '../CSS/Footer.css';
// Интерфейс для типизации акции
interface Promotion {
  id: number;
  title: string;
  description: string;
  discount: string;
  image: string;
  size: 'large' | 'small';
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
   localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
   localStorage.removeItem('token');
   navigate('/login');
  };
  const [formData, setFormData] = useState({

    phone: '',
    text:''
  });
  const [currentSlide, setCurrentSlide] = useState(0);

  // Массив данных для слайдов
  const slides = [
    "/images/допосле1.jpg",
    "/images/допосле2.jpg",
    "/images/допосле3.jpg",
    "/images/допосле4.jpg",
    // Добавьте больше слайдов по необходимости
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
 // Данные для акций
 const promotions: Promotion[] = [
  {
    id: 1,
    title: "RE-ЛИФТИНГ",
    description: "4 процедура в подарок",
    discount: "80%",
    image: "/images/акции.jpg",
    size: "large"
  },
  {
    id: 2,
    title: "Лечение глубокой пигментации",
    description: "Специальное предложение",
    discount: "15%",
    image: "/images/акции.jpg",
    size: "small"
  },
  {
    id: 3,
    title: "Лечение поверхностной пигментации",
    description: "Ограниченное время",
    discount: "15%",
    image: "/images/акции.jpg",
    size: "small"
  }
];
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Обработка отправки формы
  console.log('Form data:', formData);
  // Сброс формы
  setFormData({ phone: '', text: '' });
};

  // Компонент карточки акции 
  const PromotionCard: React.FC<{ promotion: Promotion }> = ({ promotion }) => (
    <div className={`promo-card promo-${promotion.size}`}>
      <img 
        src={promotion.image} 
        alt={promotion.title}
        className="promo-image"
      />
      <div className="promo-content">
        <h3 className="promo-title">{promotion.title}</h3>
        <p className="promo-description">{promotion.description}</p>
      </div>
      <div className="discount-circle">
        {promotion.discount}
      </div>
    </div>
  );


  return (
    <div className="main-page">
      {/* Навигация с логотипом по центру */}
      <nav className="navbar">
        <div className="nav-container">
        <div className="nav-left">
  <Link to="/main" className="nav-link">Главная</Link>
  <Link to="/services" className="nav-link">Услуги</Link>
</div>
          
          <div className="nav-center">
            <img src="/images/лого.png" alt="SKIN CODE" className="nav-logo" />
          </div>
          
          <div className="nav-right">
  <Link to="/specialists" className="nav-link">Специалисты</Link>
  <Link to="/reviews" className="nav-link">Отзывы</Link>

  <Link to="/profile" className="account-icon">
    <img src="/images/IconUser.png" alt="Личный кабинет" className="account-icon-img" />
  </Link>
</div>
        </div>
      </nav>

     
      <section className="hero-section">
        {/* Левая фоновая картинка */}
        <div className="hero-bg-left"></div>
        
        {/* Правая фоновая картинка */}
        <div className="hero-bg-right"></div>
        
        {/* Текст поверх картинок */}
        <div className="hero-content">
          <div className="text-block decode-text">
            <span className="text-line">DECODE</span>
          </div>
          
          <div className="line-container">
            <div className="horizontal-line"></div>
          </div>
          
          <div className="text-block your-text">
            <span className="text-line">YOUR</span>
          </div>
          
          <div className="line-container">
            <div className="horizontal-line"></div>
          </div>
          
          <div className="text-block skin-text">
            <span className="text-line">SKIN</span>
          </div>
          
        
          
        </div>
      </section>
         {/* Секция создателя бренда */}
         <section className="founder-section">
        <div className="founder-container">
          {/* Левая часть - стрелка и текст */}
          <div className="founder-left">
            <div className="arrow-icon">
            →
            </div>
            <div className="founder-label">
              Создатель<br />бренда
            </div>
          </div>

          {/* Центральная часть - фото создателя */}
          <div className="founder-center">
            <img 
              src="/images/косметолог1.jpg"
              alt="Александра Малахова" 
              className="founder-photo" 
            />
          </div>

          {/* Правая часть - описание в колонке */}
          <div className="founder-right">
            <div className="founder-description">
              <p>
                Александра Малахова — врач-дерматолог и косметолог с 14-летним опытом в лечении и омоложении кожи, 
                основательница клиники эстетической медицины SKIN CODE.
              </p>
              <p>
                Создание собственного бренда не было мечтой — это необходимость, в которой Александра убедилась на практике: 
                при всем разнообразии средств на рынке не хватает формул, созданных напрямую практикующими врачами-косметологами.
              </p>
              <p>
                Все продукты линии SKIN CODE — результат тандемной работы опытных врачей-дерматологов и команд биохимиков 
                и технологов из Москвы и Новосибирска.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="values-section">
        <div className="values-container">
          <div className="values-content">
            {/* Основной текст */}
            <div className="values-main-text">
              <p>
              Мы создаем пространство, где встречаются профессионализм, забота и инновации. Нас объединяют ценности индивидуального подхода, где каждый пациент — главный герой своей истории красоты и здоровья.Самое важное для нас:
              </p>
            </div>
            
            {/* Три блока с галочками */}
            <div className="values-items">
              <div className="value-item">
                <div className="check-icon">✓</div>
                <span>Этичная и доказательная медицинская практика</span>
              </div>
              
              <div className="value-item">
                <div className="check-icon">✓</div>
                <span>Белусловное здоровье наших пациентов</span>
              </div>
              
              <div className="value-item">
                <div className="check-icon">✓</div>
                <span>Профессиональное благополучие врачей</span>
              </div>
            </div>
          </div>
        </div>
      </section>
         {/* Слайдер До/После */}
         <section className="gallery-section">
        <div className="gallery-container">
          <h2 className="gallery-title">ГАЛЕРЕЯ </h2>
          <h2 className="gallery-title">ДО/ПОСЛЕ</h2>
          
          <div className="slider-wrapper">
            {/* Левая стрелка */}
            <button className="slider-arrow slider-arrow-left" onClick={prevSlide}>
            <svg  width="84" height="90" viewBox="0 0 164 105" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M102.449 1.6001L1.44934 52.1001" stroke="#EAC055" stroke-width="3" stroke-linecap="round"/>
<path d="M102.449 102.6L1.44934 52.1001" stroke="#EAC055" stroke-width="3" stroke-linecap="round"/>
<line x1="4.46821" y1="51.1002" x2="163.468" y2="53.1002" stroke="#EAC055" stroke-width="3"/>
<path d="M101.074 103.432C101.576 104.091 102.517 104.218 103.176 103.716C103.835 103.213 103.962 102.272 103.46 101.613L101.074 103.432ZM102.267 102.523L103.46 101.613L64.6423 50.6907L63.4493 51.6001L62.2564 52.5094L101.074 103.432L102.267 102.523Z" fill="#EAC055"/>
<path d="M103.828 2.42744C104.34 1.77635 104.228 0.833296 103.577 0.321082C102.926 -0.191131 101.983 -0.0785426 101.47 0.572556L103.828 2.42744ZM102.649 1.5L101.47 0.572556L61.2704 51.6727L62.4493 52.6001L63.6283 53.5275L103.828 2.42744L102.649 1.5Z" fill="#EAC055"/>
</svg>

            </button>

            {/* Слайдер */}
          
             <div className="single-image-slider">
              <div className="slide-container">
                <img 
                  src={slides[currentSlide]} 
                  alt={`Результат процедуры ${currentSlide + 1}`} 
                  className="slide-image"
                />
              </div>
            </div>


            {/* Правая стрелка */}
            <button className="slider-arrow slider-arrow-right" onClick={nextSlide}>
            <svg width="84" height="90" viewBox="0 0 164 105" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M61.0377 1.6001L162.038 52.1001" stroke="#EAC055" stroke-width="3" stroke-linecap="round"/>
<path d="M61.0377 102.6L162.038 52.1001" stroke="#EAC055" stroke-width="3" stroke-linecap="round"/>
<line y1="-1.5" x2="159.013" y2="-1.5" transform="matrix(-0.999921 0.0125776 0.0125776 0.999921 159.038 52.6001)" stroke="#EAC055" stroke-width="3"/>
<path d="M62.4134 103.432C61.9112 104.091 60.9699 104.218 60.3111 103.716C59.6523 103.213 59.5253 102.272 60.0275 101.613L62.4134 103.432ZM61.2205 102.523L60.0275 101.613L98.8448 50.6907L100.038 51.6001L101.231 52.5094L62.4134 103.432L61.2205 102.523Z" fill="#EAC055"/>
<path d="M59.6588 2.42744C59.1466 1.77635 59.2592 0.833296 59.9103 0.321082C60.5614 -0.191131 61.5044 -0.0785426 62.0166 0.572556L59.6588 2.42744ZM60.8377 1.5L62.0166 0.572556L102.217 51.6727L101.038 52.6001L99.8588 53.5275L59.6588 2.42744L60.8377 1.5Z" fill="#EAC055"/>
</svg>

            </button>
          </div>

          {/* Индикатор текущего слайда */}
          <div className="slider-indicator">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      </section>

          {/* Секция акций - В КОНЦЕ САЙТА */}
          <section className="promotions-section">
        <div className="promotions-container">
          <h2 className="promotions-title">Акции <svg className="percent-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <circle cx="20" cy="20" r="18" fill="#D4AF37"/>
  <text x="20" y="26" textAnchor="middle" fill="#121D18" fontSize="16" fontWeight="bold">%</text>
</svg></h2>
          
          <div className="promotions-grid">
            {/* Большой блок */}
            {promotions.filter(promo => promo.size === 'large').map(promotion => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}

            {/* Блок с маленькими карточками */}
            <div className="small-promos-container">
              {promotions.filter(promo => promo.size === 'small').map(promotion => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer className="main-footer">
        <div className="footer-container1">
          {/* Левая часть - название и копирайт */}
          <div className="footer-left">
            <div className="footer-logo">
              SKIN CODE<br />COSMETIC
            </div>
            <div className="footer-copyright">
              © 2025 Все права защищены. Косметологический центр
            </div>
          </div>

          {/* Центральная часть - форма */}
          <div className="footer-center">
            <h3 className="form-title1">Контакты</h3>
            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="phone"
                placeholder="Номер телефона"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                required
              />
              <input
                type="tel"
                name="text"
                placeholder="Коротко вопрос"
                value={formData.text}
                onChange={handleInputChange}
                className="form-input"
                required
              />
              <button type="submit" className="submit-button">
                Отправить
              </button>
            </form>
          </div>

          {/* Правая часть - контакты */}
          <div className="footer-right">
            <div className="contact-info">
              <div className="contact-item">
                <strong>Почта:</strong> dearYouthLab@gmail.com
              </div>
              <div className="contact-item">
                <strong>Телефон:</strong> 375(33)-444-44-44
              </div>
              <div className="contact-item">
                <strong>Соц. сети:</strong> <svg className="social-icon instagram-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="white" strokeWidth="1.5"/>
  <path d="M16.5 3.5H7.5C5.29086 3.5 3.5 5.29086 3.5 7.5V16.5C3.5 18.7091 5.29086 20.5 7.5 20.5H16.5C18.7091 20.5 20.5 18.7091 20.5 16.5V7.5C20.5 5.29086 18.7091 3.5 16.5 3.5Z" stroke="#EAC055" strokeWidth="1.5"/>
  <circle cx="17.5" cy="6.5" r="1" fill="white"/>
</svg> <svg className="social-icon telegram-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M21 5L2 12.5L9 15M21 5L15.5 21L9 15M21 5L9 15" stroke="#EAC055" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
              </div>
              <div className="contact-item">
                <strong>Адрес:</strong> ул. Руссиянова 13/1
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    
  );
};

export default MainPage;