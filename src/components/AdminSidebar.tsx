import React from 'react';
import { Link } from 'react-router-dom';

const MENU = [
  { key: 'users',        path: '/users_admin',        label: 'Пользователи' },
  { key: 'specialists',  path: '/spesialists_admin',  label: 'Мастера' },
  { key: 'services',     path: '/services_admin',     label: 'Процедуры' },
  { key: 'categories',   path: '/categories_admin',   label: 'Категории' },
  { key: 'medications',  path: '/medications_admin',  label: 'Препараты' },
  { key: 'procmed',      path: '/procmed_admin',      label: 'Процедура-Препарат' },
  { key: 'specproc',     path: '/specproc_admin',     label: 'Мастер-Процедура' },
  { key: 'reservations', path: '/reservations_admin', label: 'Записи' },
  { key: 'reviews',      path: '/reviews_admin',      label: 'Отзывы' },
  { key: 'schedule',     path: '/admin/schedule',     label: 'Расписание' },
];

const AdminSidebar: React.FC<{ active: string }> = ({ active }) => (
  <nav className="admin-sidebar">
    <h2 className="sidebar-title">Панель Админа</h2>
    <ul className="sidebar-menu">
      {MENU.map(item => (
        <li key={item.key}>
          <Link className={`menu-item${active === item.key ? ' active' : ''}`} to={item.path}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default AdminSidebar;
