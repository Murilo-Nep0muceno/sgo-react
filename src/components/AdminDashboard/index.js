import React, { useState } from 'react';
import CreateUserForm from '../CreateUserForm';
import { createAdmin, createSecretary, createDoctor } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    // Estado para controlar qual formulário está visível
    const [activeForm, setActiveForm] = useState('admin');

    const renderForm = () => {
        switch (activeForm) {
            case 'admin':
                return (
                    <CreateUserForm
                        userType="Administrador"
                        apiService={createAdmin}
                        requiredFields={['username', 'password']}
                    />
                );
            case 'secretary':
                return (
                    <CreateUserForm
                        userType="Secretária"
                        apiService={createSecretary}
                        requiredFields={['username', 'password']}
                    />
                );
            case 'doctor':
                return (
                    <CreateUserForm
                        userType="Dentista"
                        apiService={createDoctor}
                        requiredFields={['username', 'password', 'cro']}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* O Menu Lateral */}
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}>
                    <p>Bem-vindo,</p>
                    <strong>{user?.username}</strong>
                </div>
                <nav className={styles.nav}>
                    <button 
                        className={`${styles.menuButton} ${activeForm === 'admin' ? styles.active : ''}`}
                        onClick={() => setActiveForm('admin')}>
                        Gerenciar Admins
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeForm === 'secretary' ? styles.active : ''}`}
                        onClick={() => setActiveForm('secretary')}>
                        Gerenciar Secretárias
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeForm === 'doctor' ? styles.active : ''}`}
                        onClick={() => setActiveForm('doctor')}>
                        Gerenciar Dentistas
                    </button>
                </nav>
            </aside>

            {/* Área de Conteúdo Principal */}
            <main className={styles.contentArea}>
                {renderForm()}
            </main>
        </div>
    );
};

export default AdminDashboard;