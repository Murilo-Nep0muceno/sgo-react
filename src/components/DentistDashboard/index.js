import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './DentistDashboard.module.css';

const proximasConsultas = [
  { id: 1, paciente: 'Ana Silva', data: '2025-10-09', hora: '10:00', procedimento: 'Limpeza' },
  { id: 2, paciente: 'Bruno Costa', data: '2025-10-09', hora: '11:30', procedimento: 'Restauração' },
  { id: 3, paciente: 'Carlos Dias', data: '2025-10-10', hora: '14:00', procedimento: 'Avaliação' },
];

const DentistDashboard = () => {
    const { user } = useAuth();

    return (
        <main className={styles.main}>
            <h2>Painel do Dentista</h2>
            <p>Bem-vindo(a), <strong>Dr(a). {user?.username}</strong>!</p>

            <div className={styles.consultasContainer}>
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
                                    <span>{consulta.data}</span>
                                    <span>{consulta.hora}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhuma consulta agendada.</p>
                )}
            </div>
        </main>
    );
};

export default DentistDashboard;