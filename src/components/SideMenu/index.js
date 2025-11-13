import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './SideMenu.module.css';

const menuConfig = {
  admin: [
    { path: '/admin-dashboard/register-admin', label: 'Gerenciar Admins' },
    { path: '/admin-dashboard/register-secretary', label: 'Gerenciar Secretárias' },
    { path: '/admin-dashboard/register-doctor', label: 'Gerenciar Dentistas' },
  ],
  secretary: [
    { path: '/secretary-dashboard/register-client', label: 'Cadastrar Paciente' },
    { path: '/secretary-dashboard/appointments', label: 'Agendamentos' },
  ],
  doctor: [
    { path: '/dentist-dashboard/my-appointments', label: 'Minhas Consultas' },
    { path: '/dentist-dashboard/patient-history', label: 'Histórico de Pacientes' },
  ],
  client: [
     { path: '/client-dashboard/agendado', label: 'Meus Agendamentos' },
     { path: '/client-dashboard/concluido', label: 'Histórico' },
  ]
};

const SideMenu = ({ userRole }) => {
  const links = menuConfig[userRole] || [];

  return (
    <aside className={styles.sideMenu}>
      <nav className={styles.nav} aria-label="Menu principal">
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