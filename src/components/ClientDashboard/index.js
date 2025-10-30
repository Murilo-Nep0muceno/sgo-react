import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getClientAppointments, cancelAppointmentById } from '../../services/adminService';
import { translateErrorMessage } from '../helpers/errorTranslator';
import styles from './ClientDashboard.module.css';

// ========================================================================
// 0. SUB-COMPONENTES (Notificação, Modal e Card)
// ========================================================================

const Notification = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification?.message) {
            const timer = setTimeout(() => { onClose(); }, 7000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);
    if (!notification?.message) return null;
    const { type = 'info', message } = notification;
    const styleClass = type === 'success' ? styles.notificationSuccess : styles.notificationError;
    return (
        <div className={`${styles.notification} ${styleClass}`}>
            <span>{message}</span>
            <button onClick={onClose} className={styles.notificationClose}>&times;</button>
        </div>
    );
};

const ObservationViewModal = ({ observation, onClose }) => {
    if (!observation) return null;
    const examUrl = observation.exams ? `http://localhost:3000/${observation.exams.replace(/\\/g, '/')}` : null;
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Detalhes do Prontuário</h3>
                    <button onClick={onClose} className={styles.modalCloseButton}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.observationSection}>
                        <strong>Diagnóstico:</strong>
                        <p>{observation.diagnostic || "Nenhum diagnóstico registrado."}</p>
                    </div>
                    <div className={styles.observationSection}>
                        <strong>Procedimentos Realizados:</strong>
                        <p>{observation.procedures || "Nenhum procedimento registrado."}</p>
                    </div>
                    <div className={styles.observationSection}>
                        <strong>Recomendações:</strong>
                        <p>{observation.recommendations || "Nenhuma recomendação registrada."}</p>
                    </div>
                    <div className={styles.observationSection}>
                        <strong>Exames Anexados:</strong>
                        {examUrl ? (
                            <a href={examUrl} target="_blank" rel="noopener noreferrer" className={styles.examLink}>
                                Ver/Baixar Exame
                            </a>
                        ) : (
                            <p>Nenhum exame anexado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// [V2] NOVO SUB-COMPONENTE: AppointmentCard
// Isso limpa o renderContent e centraliza a lógica do card.
const AppointmentCard = ({ appointment, isCancelling, onCancel, onViewObservation }) => {
    
    // [V2] Reutiliza a classe .pastAppointment para estilizar cards que não estão 'agendados'
    const cardClasses = [
        styles.cardAgendamento,
        appointment.status !== 'agendado' ? styles.pastAppointment : ''
    ].join(' ');

    const { id, doctor, descricao, date, startTime, endTime, status, observations } = appointment;

    return (
        <div key={id} className={cardClasses}>
            <p><strong>Profissional:</strong> Dr(a). {doctor?.username || 'N/I'}</p>
            <p><strong>Procedimento:</strong> {descricao || 'Consulta'}</p>
            <p>
                <strong>Data:</strong> {new Date(`${date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                {' das '} {(startTime || '').slice(0, 5)} às {(endTime || '').slice(0, 5)}
            </p>
            <p><strong>Status:</strong> <span className={styles[`status-${status}`]}>{status}</span></p>
            
            <div className={styles.cardActions}> {/* [V2] Opcional: um wrapper para os botões */}
                {/* Botão de Cancelar (só aparece em 'agendado') */}
                {status === 'agendado' && (
                    <button
                        onClick={() => onCancel(id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isCancelling}
                    >
                        {isCancelling ? 'Cancelando...' : 'Cancelar'}
                    </button>
                )}

                {/* Botão de Ver Prontuário (só aparece em 'concluído' e se existir) */}
                {status === 'concluído' && observations && observations.length > 0 && (
                    <button
                        onClick={() => onViewObservation(appointment)}
                        className={styles.actionButton}
                    >
                        Ver Prontuário
                    </button>
                )}
            </div>
        </div>
    );
};


// ========================================================================
// 1. COMPONENTE PRINCIPAL (ClientDashboard)
// ========================================================================
const ClientDashboard = () => {
    const { user, token } = useAuth();
    
    // [V2] O activeView agora controla o FILTRO de status. Começa em 'agendado'.
    const [activeView, setActiveView] = useState('agendado'); 
    
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const clearNotification = useCallback(() => setNotification(null), []);

    const [viewingObservation, setViewingObservation] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    // [V2] Títulos para cada aba
    const viewTitles = {
        agendado: "Meus Próximos Agendamentos",
        concluído: "Histórico de Consultas Concluídas",
        cancelado: "Consultas Canceladas"
    };

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        clearNotification();
        try {
            const data = await getClientAppointments(token);
            // [V52] A API agora retorna appointment.observations
            const extractedAppointments = Array.isArray(data) ? data.map(item => item.appointment) : [];

            const sortedAppointments = extractedAppointments
                .filter(app => app && app.date && app.startTime)
                .sort((a, b) => {
                    const dateComparison = (b.date || '').localeCompare(a.date || ''); // Mais recente primeiro
                    if (dateComparison !== 0) return dateComparison;
                    return (a.startTime || '').localeCompare(b.startTime || '');
                });
            
            setAppointments(sortedAppointments);
        } catch (err) {
            console.error("Error fetching client appointments:", err);
            const friendlyError = translateErrorMessage(err.message, 'Falha ao carregar seus agendamentos.');
            setNotification({ type: 'error', message: friendlyError });
        } finally {
            setIsLoading(false);
        }
    }, [token, clearNotification]);

    useEffect(() => {
        if (token) {
            fetchAppointments();
        } else {
            setIsLoading(false);
            setNotification({ type: 'error', message: "Usuário não autenticado." });
        }
    }, [fetchAppointments, token]);

    const handleCancel = async (appointmentId) => {
        if (!appointmentId) return;
        clearNotification();
        if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
            setCancellingId(appointmentId);
            try {
                await cancelAppointmentById(appointmentId, token);
                setNotification({ type: 'success', message: 'Consulta cancelada com sucesso!' });
                
                // [V2] ATUALIZAÇÃO IMPORTANTE:
                // Em vez de apenas mudar o status, vamos RECARREGAR os dados.
                // Isso é mais seguro caso a V52 tenha mudado o sorting (o que mudou).
                // setAppointments(prev => prev.map(app =>
                //     app.id === appointmentId ? { ...app, status: 'cancelado' } : app
                // ));
                // O agendamento cancelado deve sumir da aba 'agendado' e ir para 'cancelado'.
                // O fetchAppointments() garante que todas as listas estão corretas.
                fetchAppointments();

            } catch (err) {
                console.error("Error cancelling appointment:", err);
                const friendlyError = translateErrorMessage(err.message, 'Erro ao cancelar a consulta.');
                setNotification({ type: 'error', message: friendlyError });
            } finally {
                setCancellingId(null);
            }
        }
    };

    const handleViewObservation = (appointment) => {
        if (appointment.observations && appointment.observations.length > 0) {
            setViewingObservation(appointment.observations[0]);
        } else {
            setNotification({ type: 'info', message: 'Nenhum prontuário foi registrado para esta consulta ainda.' });
        }
    };

    // [V2] renderContent foi DRASTICAMENTE simplificado.
    // Ele agora é responsável apenas por filtrar e renderizar a lista
    // com base no 'activeView' selecionado no menu.
    const renderContent = () => {
        
        // Filtra a lista de agendamentos com base na aba ativa
        const filteredAppointments = appointments.filter(app => app?.status === activeView);

        return (
            <div>
                {/* O título agora é dinâmico com base na aba */}
                <h3>{viewTitles[activeView]}</h3>
                
                {isLoading && <p>Carregando...</p>}
                
                {!isLoading && !notification && filteredAppointments.length === 0 && (
                    <p>
                        {activeView === 'agendado' ? 'Você não possui agendamentos futuros.' : 'Nenhum registro encontrado para esta categoria.'}
                    </p>
                )}

                {/* Renderiza a lista filtrada usando o novo AppointmentCard */}
                {filteredAppointments.map(ag => (
                    <AppointmentCard
                        key={ag.id}
                        appointment={ag}
                        isCancelling={cancellingId === ag.id}
                        onCancel={handleCancel}
                        onViewObservation={handleViewObservation}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}>
                    <p>Olá,</p>
                    <strong>{user?.username || 'Cliente'}</strong>
                </div>
                
                {/* [V2] O menu de navegação agora tem 3 botões que controlam o 'activeView' */}
                <nav className={styles.nav}>
                    <button
                        className={`${styles.menuButton} ${activeView === 'agendado' ? styles.active : ''}`}
                        onClick={() => setActiveView('agendado')}>
                        Agendados
                    </button>
                    
                    <button
                        className={`${styles.menuButton} ${activeView === 'concluído' ? styles.active : ''}`}
                        onClick={() => setActiveView('concluído')}>
                        Histórico (Concluídos)
                    </button>
                    
                    <button
                        className={`${styles.menuButton} ${activeView === 'cancelado' ? styles.active : ''}`}
                        onClick={() => setActiveView('cancelado')}>
                        Cancelados
                    </button>
                </nav>
            </aside>
            
            <main className={styles.contentArea}>
                <Notification notification={notification} onClose={clearNotification} />
                {renderContent()}
            </main>

            {/* O Modal de Prontuário continua igual */}
            {viewingObservation && (
                <ObservationViewModal
                    observation={viewingObservation}
                    onClose={() => setViewingObservation(null)}
                />
            )}
        </div>
    );
};

export default ClientDashboard;