import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './ClientDashboard.module.css';

// Dados de exemplo - no futuro, isso virá da sua API
const meusAgendamentos = [
  { id: 1, data: '2025-10-20', hora: '15:00', dentista: 'Dr. Ricardo', procedimento: 'Limpeza de Rotina' },
  { id: 2, data: '2025-11-05', hora: '09:30', dentista: 'Dra. Ana', procedimento: 'Avaliação Ortodôntica' }
];

const ClientDashboard = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState('appointments'); // Visão inicial

    const renderContent = () => {
        switch (activeView) {
            case 'appointments':
                return (
                    <div>
                        <h3>Meus Próximos Agendamentos</h3>
                        {meusAgendamentos.length > 0 ? (
                            meusAgendamentos.map(ag => (
                                <div key={ag.id} className={styles.cardAgendamento}>
                                    <p><strong>Procedimento:</strong> {ag.procedimento}</p>
                                    <p><strong>Data:</strong> {new Date(ag.data).toLocaleDateString('pt-BR')} às {ag.hora}</p>
                                    <p><strong>Profissional:</strong> {ag.dentista}</p>
                                </div>
                            ))
                        ) : (
                            <p>Você não possui agendamentos futuros.</p>
                        )}
                    </div>
                );
            case 'history':
                // Placeholder para a futura funcionalidade
                return (
                    <div>
                        <h3>Histórico de Consultas</h3>
                        <p>Funcionalidade a ser implementada. Aqui você poderá ver suas consultas passadas.</p>
                    </div>
                );
            default:
                return <h2>Selecione uma opção</h2>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Menu Lateral */}
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}>
                    <p>Olá,</p>
                    <strong>{user?.username}</strong>
                </div>
                <nav className={styles.nav}>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'appointments' ? styles.active : ''}`}
                        onClick={() => setActiveView('appointments')}>
                        Consultas Marcadas
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'history' ? styles.active : ''}`}
                        onClick={() => setActiveView('history')}>
                        Histórico de Consultas
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

export default ClientDashboard;