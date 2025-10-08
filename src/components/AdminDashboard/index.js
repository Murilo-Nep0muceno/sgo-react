import React from 'react';
import CreateUserForm from '../CreateUserForm';
import { createAdmin, createSecretary, createDoctor } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    
    return (
        <main className={styles.main}>
            <h2>Painel do Administrador</h2>
            <p>Bem-vindo, <strong>{user?.username}</strong>!</p>
            <div className={styles.formsContainer}>
                <CreateUserForm
                    userType="Administrador"
                    apiService={createAdmin}
                    requiredFields={['username', 'password']}
                />
                <CreateUserForm
                    userType="Secretária"
                    apiService={createSecretary}
                    requiredFields={['username', 'password']}
                />
                <CreateUserForm
                    userType="Dentista"
                    apiService={createDoctor}
                    requiredFields={['username', 'password', 'cro']}
                />
            </div>
        </main>
    );
};

export default AdminDashboard;