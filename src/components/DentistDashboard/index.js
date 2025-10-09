import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './DentistDashboard.module.css';

// Dados de exemplo - no futuro, isso virá da sua API
const proximasConsultas = [
  { id: 1, paciente: 'Ana Silva', data: '2025-10-09', hora: '10:00', procedimento: 'Limpeza' },
  { id: 2, paciente: 'Bruno Costa', data: '2025-10-09', hora: '11:30', procedimento: 'Restauração' },
  { id: 3, paciente: 'Carlos Dias', data: '2025-10-10', hora: '14:00', procedimento: 'Avaliação' },
];

const DentistDashboard = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState('appointments'); // Visão inicial

    const renderContent = () => {
        switch (activeView) {
            case 'appointments':
                return (
                    <div>
                        <h3>Próximas Consultas</h3>
                        {proximasConsultas.length > 0 ? (
                            <ul className={styles.listaConsultas}>
                                {proximasConsultas.map(consulta => (
                                    <li key={consulta.id} className={styles.itemConsulta}>
                                        <div className={styles.info}>
                                            <span className={styles.paciente}>{consulta.paciente}</span>
                                            <span className={styles.procedimento}>{consulta.procedimento}</span>
                                        </div>
                                        <div className={styles.horario}>
                                            <span>{new Date(consulta.data).toLocaleDateString('pt-BR')}</span>
                                            <span>{consulta.hora}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhuma consulta agendada.</p>
                        )}
                    </div>
                );
            case 'history':
                // Placeholder para a futura funcionalidade
                return (
                    <div>
                        <h3>Histórico de Pacientes</h3>
                        <p>Funcionalidade a ser implementada.</p>
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
                    <p>Bem-vindo(a),</p>
                    <strong>Dr(a). {user?.username}</strong>
                </div>
                <nav className={styles.nav}>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'appointments' ? styles.active : ''}`}
                        onClick={() => setActiveView('appointments')}>
                        Próximas Consultas
                    </button>
                    <button 
                        className={`${styles.menuButton} ${activeView === 'history' ? styles.active : ''}`}
                        onClick={() => setActiveView('history')}>
                        Histórico de Pacientes
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

export default DentistDashboard;