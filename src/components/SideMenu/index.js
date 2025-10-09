import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SideMenu.module.css';

// Objeto de configuração para os menus de cada tipo de usuário
const menuConfig = {
   admin: [
    { path: '/admin-dashboard/register-admin', label: 'Gerenciar Admins' }, // MUDOU
    { path: '/admin-dashboard/register-secretary', label: 'Gerenciar Secretárias' }, // MUDOU
    { path: '/admin-dashboard/register-doctor', label: 'Gerenciar Dentistas' }, // MUDOU
  ],
  secretary: [
    { path: '/secretary-dashboard/register-client', label: 'Cadastrar Paciente' },
    { path: '/secretary-dashboard/appointments', label: 'Agendamentos' },
  ],
  doctor: [
    { path: '/dentist-dashboard/my-appointments', label: 'Minhas Consultas' },
    { path: '/dentist-dashboard/patient-history', label: 'Histórico de Pacientes' },
  ],
};

const SideMenu = ({ userRole }) => {
  const links = menuConfig[userRole] || [];

  return (
    <aside className={styles.sideMenu}>
      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SideMenu;