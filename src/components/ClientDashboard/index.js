import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getClientAppointments, 
  cancelAppointmentById, 
  getClientProfile, 
  updateClientProfile 
} from '../../services/adminService';
import { translateErrorMessage } from '../helpers/errorTranslator';
import styles from './ClientDashboard.module.css';

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
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div className={`${styles.notification} ${styleClass}`} role={role}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.notificationClose} aria-label="Fechar notificação">×</button>
    </div>
  );
};

const ObservationViewModal = ({ observation, onClose }) => {
  if (!observation) return null;
  const examUrl = observation.exams ? `http://localhost:3000/${observation.exams.replace(/\\/g, '/')}` : null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="obs-modal-title">
        <div className={styles.modalHeader}>
          <h3 id="obs-modal-title">Detalhes do Prontuário</h3>
          <button onClick={onClose} className={styles.modalCloseButton} aria-label="Fechar modal">×</button>
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

const ConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="cancel-modal-title" aria-describedby="cancel-modal-desc">
        <div className={styles.modalHeader}>
          <h3 id="cancel-modal-title">Confirmar Cancelamento</h3>
          <button onClick={onClose} className={styles.modalCloseButton} aria-label="Fechar modal" disabled={isLoading}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p id="cancel-modal-desc">Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.</p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.secondaryButton} disabled={isLoading}>
            Voltar
          </button>
          <button onClick={onConfirm} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isLoading}>
            {isLoading ? 'Cancelando...' : 'Sim, Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppointmentCard = ({ appointment, isCancelling, onCancel, onViewObservation }) => {
  const cardClasses = [
    styles.cardAgendamento,
    appointment.status !== 'agendado' ? styles.pastAppointment : ''
  ].join(' ');

  const { id, doctor, descricao, date, startTime, endTime, status, observations } = appointment;
  
  const formattedDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formattedStartTime = (startTime || '').slice(0, 5);
  const formattedEndTime = (endTime || '').slice(0, 5);
  const doctorName = doctor?.username || 'N/I';
  const procedureDesc = descricao || 'Consulta';

  return (
    <div key={id} className={cardClasses}>
      <p><strong>Profissional:</strong> Dr(a). {doctorName}</p>
      <p><strong>Procedimento:</strong> {procedureDesc}</p>
      <p>
        <strong>Data:</strong> {formattedDate}
        {' das '} {formattedStartTime} às {formattedEndTime}
      </p>
      <p><strong>Status:</strong> <span className={styles[`status-${status}`]}>{status}</span></p>
      
      <div className={styles.cardActions}>
        {status === 'agendado' && (
          <button
            onClick={() => onCancel(id)}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            disabled={isCancelling}
            aria-label={`Cancelar agendamento de ${procedureDesc} em ${formattedDate}`}
          >
            {isCancelling ? 'Cancelando...' : 'Cancelar'}
          </button>
        )}

        {status === 'concluído' && observations && observations.length > 0 && (
          <button
            onClick={() => onViewObservation(appointment)}
            className={`${styles.actionButton} ${styles.viewButton}`}
            aria-label={`Ver prontuário de ${procedureDesc} em ${formattedDate}`}
          >
            Ver Prontuário
          </button>
        )}
      </div>
    </div>
  );
};

const ProfileView = ({ token, setNotification }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    telephone: '',
    password: '',
    zipCode: '',
    street: '',
    number: '',
    state: '',
    neighborhood: ''
  });

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClientProfile(token);
      const address = (data.addresses && data.addresses.length > 0) ? data.addresses[0] : {};
      
      setFormData({
        username: data.username || '',
        email: data.email || '',
        telephone: data.telephone || '',
        password: '',
        zipCode: address.zipCode || '',
        street: address.street || '',
        number: address.number || '',
        state: address.state || '',
        neighborhood: address.neighborhood || ''
      });
    } catch (err) {
      setNotification({ type: 'error', message: translateErrorMessage(err.message, "Erro ao carregar perfil.") });
    } finally {
      setIsLoading(false);
    }
  }, [token, setNotification]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const maskPhone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");
  };

  const maskCEP = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "telephone") {
      value = maskPhone(value);
    } else if (name === "zipCode") {
      value = maskCEP(value);
    } else if (name === "email") {
      value = value.replace(/\s/g, "");
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      
      await updateClientProfile(payload, token);
      setNotification({ type: 'success', message: "Perfil atualizado com sucesso!" });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setNotification({ type: 'error', message: translateErrorMessage(err.message, "Erro ao atualizar perfil.") });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Carregando perfil...</p>;

  return (
    <div>
      <h2 className={styles.contentTitle}>Meu Perfil</h2>
      
      <form onSubmit={handleSave} className={styles.profileForm}>
        <h3 className={styles.profileSectionTitle}>Dados Pessoais</h3>
        
        <div className={styles.profileFormGroup}>
          <label htmlFor="username">Nome Completo</label>
          <input 
            id="username" name="username" type="text" 
            value={formData.username} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} required 
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="email">Email</label>
          <input 
            id="email" name="email" type="email" 
            value={formData.email} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} required 
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="telephone">Telefone</label>
          <input 
            id="telephone" name="telephone" type="tel" 
            value={formData.telephone} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} required 
            placeholder="(11) 99999-9999"
            maxLength="15"
          />
        </div>

        {isEditing && (
          <div className={styles.profileFormGroup}>
            <label htmlFor="password">Nova Senha (deixe em branco para manter)</label>
            <input 
              id="password" name="password" type="password" 
              value={formData.password} onChange={handleChange} 
              disabled={!isEditing} className={styles.profileInput} 
              placeholder="********"
            />
          </div>
        )}

        <h3 className={styles.profileSectionTitle}>Endereço</h3>

        <div className={styles.profileFormGroup}>
          <label htmlFor="zipCode">CEP</label>
          <input 
            id="zipCode" name="zipCode" type="text" 
            value={formData.zipCode} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} 
            placeholder="00000-000"
            maxLength="9"
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="street">Rua</label>
          <input 
            id="street" name="street" type="text" 
            value={formData.street} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} 
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="number">Número</label>
          <input 
            id="number" name="number" type="text" 
            value={formData.number} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} 
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="neighborhood">Bairro</label>
          <input 
            id="neighborhood" name="neighborhood" type="text" 
            value={formData.neighborhood} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} 
          />
        </div>

        <div className={styles.profileFormGroup}>
          <label htmlFor="state">Estado</label>
          <input 
            id="state" name="state" type="text" 
            value={formData.state} onChange={handleChange} 
            disabled={!isEditing} className={styles.profileInput} 
          />
        </div>

        <div className={styles.cardActions}>
          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)} className={`${styles.actionButton} ${styles.goldenButton}`}>
              Editar Dados
            </button>
          ) : (
            <>
              <button type="button" onClick={() => { setIsEditing(false); fetchProfile(); }} className={styles.secondaryButton} disabled={isSaving}>
                Cancelar
              </button>
              <button type="submit" className={`${styles.actionButton} ${styles.goldenButton}`} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

const ClientDashboard = () => {
  const { user, token } = useAuth();
  const [activeView, setActiveView] = useState('agendado');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const clearNotification = useCallback(() => setNotification(null), []);

  const [viewingObservation, setViewingObservation] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [cancelModalState, setCancelModalState] = useState({ isOpen: false, appointmentId: null });

  const viewTitles = {
    agendado: "Meus Próximos Agendamentos",
    concluído: "Histórico de Consultas Concluídas",
    cancelado: "Consultas Canceladas",
    profile: "Meu Perfil"
  };

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    clearNotification();
    try {
      const data = await getClientAppointments(token);
      const extractedAppointments = Array.isArray(data) ? data.map(item => item.appointment) : [];

      const sortedAppointments = extractedAppointments
        .filter(app => app && app.date && app.startTime)
        .sort((a, b) => {
          const dateComparison = (b.date || '').localeCompare(a.date || '');
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
      if (activeView !== 'profile') {
        fetchAppointments();
      }
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: "Usuário não autenticado." });
    }
  }, [fetchAppointments, token, activeView]);

  const requestCancel = (appointmentId) => {
    if (!appointmentId) return;
    clearNotification();
    setCancelModalState({ isOpen: true, appointmentId: appointmentId });
  };

  const handleConfirmCancel = async () => {
    const { appointmentId } = cancelModalState;
    if (!appointmentId) return;

    setCancellingId(appointmentId);
    setCancelModalState({ isOpen: false, appointmentId: null });

    try {
      await cancelAppointmentById(appointmentId, token);
      setNotification({ type: 'success', message: 'Consulta cancelada com sucesso!' });
      fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      const friendlyError = translateErrorMessage(err.message, 'Erro ao cancelar a consulta.');
      setNotification({ type: 'error', message: friendlyError });
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewObservation = (appointment) => {
    if (appointment.observations && appointment.observations.length > 0) {
      setViewingObservation(appointment.observations[0]);
    } else {
      setNotification({ type: 'info', message: 'Nenhum prontuário foi registrado para esta consulta ainda.' });
    }
  };

  const renderContent = () => {
    if (activeView === 'profile') {
      return <ProfileView token={token} setNotification={setNotification} />;
    }

    const filteredAppointments = appointments.filter(app => app?.status === activeView);

    return (
      <div>
        <h2 id="content-title" className={styles.contentTitle}>
          {viewTitles[activeView]}
        </h2>
        
        {isLoading && <p>Carregando...</p>}
        
        {!isLoading && !notification && filteredAppointments.length === 0 && (
          <p>
            {activeView === 'agendado' ? 'Você não possui agendamentos futuros.' : 'Nenhum registro encontrado para esta categoria.'}
          </p>
        )}

        {filteredAppointments.map(ag => (
          <AppointmentCard
            key={ag.id}
            appointment={ag}
            isCancelling={cancellingId === ag.id}
            onCancel={requestCancel}
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
        
        <nav className={styles.nav} aria-label="Menu principal do cliente">
          <button
            className={`${styles.menuButton} ${activeView === 'agendado' ? styles.active : ''}`}
            onClick={() => setActiveView('agendado')}
            aria-current={activeView === 'agendado' ? 'page' : undefined}
          >
            Agendados
          </button>
          
          <button
            className={`${styles.menuButton} ${activeView === 'concluído' ? styles.active : ''}`}
            onClick={() => setActiveView('concluído')}
            aria-current={activeView === 'concluído' ? 'page' : undefined}
          >
            Histórico (Concluídos)
          </button>
          
          <button
            className={`${styles.menuButton} ${activeView === 'cancelado' ? styles.active : ''}`}
            onClick={() => setActiveView('cancelado')}
            aria-current={activeView === 'cancelado' ? 'page' : undefined}
          >
            Cancelados
          </button>

          <button
            className={`${styles.menuButton} ${activeView === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveView('profile')}
            aria-current={activeView === 'profile' ? 'page' : undefined}
          >
            Meu Perfil
          </button>
        </nav>
      </aside>
      
      <main className={styles.contentArea} aria-labelledby="content-title">
        <Notification notification={notification} onClose={clearNotification} />
        {renderContent()}
      </main>

      {viewingObservation && (
        <ObservationViewModal
          observation={viewingObservation}
          onClose={() => setViewingObservation(null)}
        />
      )}

      <ConfirmationModal
        isOpen={cancelModalState.isOpen}
        onClose={() => setCancelModalState({ isOpen: false, appointmentId: null })}
        onConfirm={handleConfirmCancel}
        isLoading={!!cancellingId}
      />
    </div>
  );
};

export default ClientDashboard;