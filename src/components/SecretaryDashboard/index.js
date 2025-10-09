import React, { useState } from 'react';
import CreateUserForm from '../CreateUserForm';
import { createClient } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import styles from './SecretaryDashboard.module.css'; // Usaremos o CSS próprio

const SecretaryDashboard = () => {
    const { user } = useAuth();
    // Estado para controlar a visão ativa. 'registerClient' é a única funcional por enquanto.
    const [activeView, setActiveView] = useState('registerClient');

    const renderContent = () => {
        switch (activeView) {
            case 'registerClient':
                return (
                    <CreateUserForm
                        userType="Paciente"
                        apiService={createClient}
                        requiredFields={['username', 'email', 'telephone', 'password']}
                    />
                );
            case 'viewClients':
                // Futuramente, aqui ficará a tabela para ver os pacientes
                return <h2>Visualizar Pacientes Cadastrados</h2>;
            case 'appointments':
                 // Futuramente, aqui ficará a gestão de agendamentos
                return <h2>Gerenciar Agendamentos</h2>;
            default:
                return <h2>Selecione uma opção</h2>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Menu Lateral */}
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}>
                    <p>Bem-vindo(a),</p>
                    <strong>{user?.username}</strong>
                </div>
                <nav className={styles.nav}>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'registerClient' ? styles.active : ''}`}
                        onClick={() => setActiveView('registerClient')}>
                        Cadastrar Paciente
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'viewClients' ? styles.active : ''}`}
                        onClick={() => setActiveView('viewClients')}>
                        Ver Pacientes
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'appointments' ? styles.active : ''}`}
                        onClick={() => setActiveView('appointments')}>
                        Agendamentos
                    </button>
                </nav>
            </aside>

            {/* Área de Conteúdo Principal */}
            <main className={styles.contentArea}>
                {renderContent()}
            </main>
        </div>
    );
};

export default SecretaryDashboard;