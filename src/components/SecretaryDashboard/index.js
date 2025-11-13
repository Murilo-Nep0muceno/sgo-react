import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  createClient,
  getAvailableSchedules,
  createAppointment,
  getAllBookedAppointments,
  updateAppointment,
  cancelAppointmentById
} from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import CreateUserForm from '../CreateUserForm';
import styles from './SecretaryDashboard.module.css';
import { translateErrorMessage } from '../helpers/errorTranslator';
import * as XLSX from 'xlsx';

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification?.message) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
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

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmed = confirmationText.toLowerCase() === 'confirmar';
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (isConfirmed) { onConfirm(); } 
  };
  
  const handleClose = () => { 
    if (!isLoading) { 
      setConfirmationText(''); 
      onClose(); 
    } 
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
        <div className={styles.modalHeader}>
          <h3 id="modal-title">{title}</h3>
          <button onClick={handleClose} className={styles.modalCloseButton} disabled={isLoading} aria-label="Fechar modal">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <p id="modal-desc">{message}</p>
            <label htmlFor="confirmInput" className={styles.modalConfirmLabel}>
              Para confirmar, digite <strong>confirmar</strong> abaixo:
            </label>
            <input 
              id="confirmInput" 
              type="text" 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value)} 
              placeholder="confirmar" 
              className={styles.modalConfirmInput} 
              autoFocus 
            />
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={handleClose} className={styles.secondaryButton} disabled={isLoading}>Cancelar</button>
            <button type="submit" className={styles.button} disabled={!isConfirmed || isLoading}>
              {isLoading ? 'Processando...' : 'Confirmar Ação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScheduleFilters = ({ doctors, onDateChange, onDoctorChange, onClearFilters }) => (
  <div className={styles.filterContainer}>
    <input 
      type="date" 
      onChange={(e) => onDateChange(e.target.value)} 
      className={styles.filterInput} 
      aria-label="Filtrar por data" 
    />
    <select 
      onChange={(e) => onDoctorChange(e.target.value)} 
      className={styles.filterInput} 
      aria-label="Filtrar por dentista"
    >
      <option value="">Todos os Dentistas</option>
      {Array.isArray(doctors) && doctors.map(doctor => (
        <option key={doctor?.id} value={doctor?.id}>
          {doctor?.username || 'Doutor Inválido'}
        </option>
      ))}
    </select>
    <button onClick={onClearFilters} className={styles.clearButton}>Limpar Filtros</button>
  </div>
);

const SchedulesList = ({ groupedSchedules, onSelectSchedule, selectable = true }) => {
  const dates = groupedSchedules ? Object.keys(groupedSchedules).sort() : [];
  if (dates.length === 0) return <p>Nenhum horário disponível encontrado para os filtros selecionados.</p>;

  const handleKeyPress = (e, schedule) => {
    if (selectable && schedule && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelectSchedule(schedule);
    }
  };

  return (
    <div>
      {dates.map(date => (
        <div key={date} className={styles.dateGroup}>
          <h3>
            {date ? new Date(`${date}T00:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Data Inválida'}
          </h3>
          <div className={styles.schedulesGrid}>
            {Array.isArray(groupedSchedules[date]) && groupedSchedules[date].map(schedule => {
              const bookedApps = (schedule.appointments || []).filter(app => app.status === 'agendado').sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
              const cardLabel = `Doutor(a) ${schedule?.doctor?.username || 'N/A'}. Turno: ${schedule?.startTime?.slice(0, 5) ?? 'N/A'} - ${schedule?.endTime?.slice(0, 5) ?? 'N/A'}. ${bookedApps.length} horários ocupados. ${selectable ? 'Clique para selecionar esta vaga.' : ''}`;
              
              return (
                <div 
                  key={schedule?.id} 
                  className={`${styles.scheduleCard} ${selectable ? styles.selectableCard : ''}`} 
                  onClick={() => selectable && schedule && onSelectSchedule(schedule)} 
                  role={selectable ? "button" : "group"} 
                  tabIndex={selectable ? 0 : -1} 
                  onKeyPress={(e) => handleKeyPress(e, schedule)}
                  aria-label={cardLabel}
                >
                  <p><strong>Doutor(a):</strong> {schedule?.doctor?.username || 'N/A'}</p>
                  <p><strong>Turno:</strong> {schedule?.startTime?.slice(0, 5) ?? 'N/A'} - {schedule?.endTime?.slice(0, 5) ?? 'N/A'}</p>
                  {schedule.appointments && (
                    <div className={styles.bookedTimes}>
                      <strong className={styles.bookedTimesTitle}>Horários Ocupados:</strong>
                      {bookedApps.length > 0 ? (
                        <ul className={styles.bookedTimesList}>
                          {bookedApps.map((app, index) => (
                            <li key={index} className={styles.bookedTimeItem}>
                              {app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}
                            </li>
                          ))}
                        </ul>
                      ) : (<p className={styles.noBookedTimes}>Nenhum horário agendado nesta vaga.</p>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const AppointmentForm = ({ schedule, onSubmit, onBack, isLoading, serverError }) => {
  const [error, setError] = useState('');
  const scheduleDate = schedule?.dayOfWeek ? new Date(`${schedule.dayOfWeek}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data Indisponível';
  const scheduleStartTime = schedule?.startTime?.slice(0, 5) ?? '00:00';
  const scheduleEndTime = schedule?.endTime?.slice(0, 5) ?? '23:59';
  
  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (!schedule || !schedule.startTime || !schedule.endTime) { setError("Erro: Dados da agenda selecionada estão incompletos ou inválidos."); return; }
    
    const formData = new FormData(e.target);
    const appointmentData = { 
      email: formData.get('email'), 
      startTime: formData.get('startTime'), 
      endTime: formData.get('endTime'), 
      descricao: formData.get('descricao'), 
      status: 'agendado', 
    };

    if (!appointmentData.startTime || !appointmentData.endTime) { setError('Horário de início e fim são obrigatórios.'); return; }
    if (appointmentData.startTime < scheduleStartTime || appointmentData.endTime > scheduleEndTime) { setError(`Horário inválido. A consulta deve ser dentro do turno: ${scheduleStartTime} - ${scheduleEndTime}.`); return; }
    if (appointmentData.startTime >= appointmentData.endTime) { setError('O horário de início deve ser antes do horário de fim.'); return; }
    onSubmit(appointmentData);
  };
  
  return (
    <div>
      <button onClick={onBack} className={styles.backButton}>← Voltar para a lista</button>
      <h3 id="content-title">Agendar Consulta</h3>
      <div className={styles.scheduleCardInfo} role="region" aria-label="Detalhes da Vaga Selecionada">
        <p><strong>Doutor(a):</strong> {schedule?.doctor?.username || 'N/A'}</p>
        <p><strong>Data:</strong> {scheduleDate}</p>
        <p><strong>Turno Completo:</strong> {scheduleStartTime} - {scheduleEndTime}</p>
      </div>
      <form onSubmit={handleSubmit} className={styles.appointmentForm}>
        <label htmlFor="apt-email">Email do Paciente</label>
        <input id="apt-email" name="email" type="email" placeholder="email@paciente.com" required className={styles.input} autoComplete="email" autoFocus />
        
        <label htmlFor="apt-startTime">Hora de Início</label>
        <input id="apt-startTime" name="startTime" type="time" required className={styles.input} min={scheduleStartTime} max={scheduleEndTime} />
        
        <label htmlFor="apt-endTime">Hora de Fim</label>
        <input id="apt-endTime" name="endTime" type="time" required className={styles.input} min={scheduleStartTime} max={scheduleEndTime} />
        
        <label htmlFor="apt-descricao">Descrição (Opcional)</label>
        <input id="apt-descricao" name="descricao" type="text" placeholder="Ex: Avaliação inicial" className={styles.input}/>
        
        {error && <p className={styles.error} role="alert">{error}</p>}
        {serverError && <p className={styles.error} role="alert">{serverError}</p>}
        <button type="submit" disabled={isLoading} className={styles.button}>{isLoading ? 'Agendando...' : 'Confirmar Agendamento'}</button>
      </form>
    </div>
  );
};

const BookedAppointmentsList = ({ appointments, onReschedule, onCancel, isLoading }) => {
  if (!Array.isArray(appointments) || appointments.length === 0) { 
    return <p>Nenhuma consulta agendada encontrada.</p>; 
  }
  
  return (
    <div className={styles.tableContainer}>
      <table className={styles.userTable} role="table">
        <thead>
          <tr>
            <th>Paciente</th><th>Doutor(a)</th><th>Data</th><th>Horário</th><th>Status</th><th>Descrição</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(app => (
            <tr key={app?.id} className={app?.status === 'cancelado' ? styles.cancelledRow : ''}>
              <td data-label="Paciente">{app?.patient?.username || 'N/A'}</td>
              <td data-label="Doutor(a)">{app?.doctor?.username || 'N/A'}</td>
              <td data-label="Data">{app?.date ? new Date(`${app.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</td>
              <td data-label="Horário">{app?.startTime?.slice(0, 5)} - {app?.endTime?.slice(0, 5)}</td>
              <td data-label="Status" className={styles[`status-${app?.status}`]}>{app?.status || 'N/A'}</td>
              <td data-label="Descrição">{app?.descricao || '-'}</td>
              <td data-label="Ações" className={styles.actionsCell}>
                <button 
                  onClick={() => app && onReschedule(app)} 
                  className={`${styles.actionButton} ${styles.editButton}`} 
                  disabled={isLoading || app?.status === 'cancelado' || app?.status === 'concluído'}
                  aria-label={`Alterar consulta de ${app?.patient?.username || 'paciente'}`}
                >
                  Alterar
                </button>
                <button 
                  onClick={() => app?.id && onCancel(app.id)} 
                  className={`${styles.actionButton} ${styles.deleteButton}`} 
                  disabled={isLoading || app?.status === 'cancelado' || app?.status === 'concluído'}
                  aria-label={`Cancelar consulta de ${app?.patient?.username || 'paciente'}`}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AlterarEditForm = ({ appointment, newlySelectedSchedule, onSubmit, onCancel, onGoToSelectSlot, onOpenConfirm, isLoading, serverError }) => {
  const [date, setDate] = useState(appointment.date || getTodayString());
  const [startTime, setStartTime] = useState((appointment.startTime || '09:00').slice(0, 5));
  const [endTime, setEndTime] = useState((appointment.endTime || '10:00').slice(0, 5));
  const [status, setStatus] = useState(appointment.status || 'agendado');
  const [descricao, setDescricao] = useState(appointment.descricao || '');
  const [error, setError] = useState('');
  const [timeLimits, setTimeLimits] = useState(null);

  useEffect(() => {
    if (newlySelectedSchedule) {
      const newMin = (newlySelectedSchedule.startTime || '00:00').slice(0, 5);
      const newMax = (newlySelectedSchedule.endTime || '23:59').slice(0, 5);
      setDate(newlySelectedSchedule.dayOfWeek || getTodayString());
      setStartTime(newMin);
      setEndTime(newMax);
      setTimeLimits({ min: newMin, max: newMax });
    }
  }, [newlySelectedSchedule]);

  const patientName = appointment?.patient?.username ?? 'N/A';
  const doctorName = newlySelectedSchedule?.doctor?.username || appointment?.doctor?.username || 'N/A';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!date || !startTime || !endTime || !status) { setError('Data, Hora de Início, Hora de Fim e Status são obrigatórios.'); return; }
    if (startTime >= endTime) { setError('O horário de início deve ser antes do horário de fim.'); return; }
    if (timeLimits) {
      if (startTime < timeLimits.min || endTime > timeLimits.max) {
        setError(`Horário inválido. A consulta deve ser entre ${timeLimits.min} e ${timeLimits.max}.`); return;
      }
    }
    const updatedData = { dateOfWeek: date, dayOfWeek: date, startTime, endTime, status, descricao };
    onOpenConfirm(updatedData);
  };

  return (
    <div>
      <button onClick={onCancel} className={styles.backButton}>← Cancelar Alterações</button>
      <h3 id="content-title">Editar / Alterar Consulta</h3>
      <div className={styles.scheduleCardInfo} role="region" aria-label="Detalhes da Consulta">
        <p><strong>Paciente:</strong> {patientName}</p>
        <p><strong>Doutor(a):</strong> {doctorName}</p>
      </div>
      <form onSubmit={handleSubmit} className={styles.appointmentForm}>
        <label htmlFor="resched-date">Data da Consulta</label>
        <input id="resched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={styles.input} />
        
        <button type="button" onClick={onGoToSelectSlot} className={styles.secondaryButton}>Procurar Novo Dia / Vaga</button>
        
        <label htmlFor="resched-startTime">Hora de Início</label>
        <input id="resched-startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} min={timeLimits?.min || '00:00'} max={timeLimits?.max || '23:59'} required className={styles.input} />
        
        <label htmlFor="resched-endTime">Hora de Fim</label>
        <input id="resched-endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} min={timeLimits?.min || '00:00'} max={timeLimits?.max || '23:59'} required className={styles.input} />
        
        {timeLimits && (<p className={styles.timeHint}>Horário disponível nesta vaga: {timeLimits.min} - {timeLimits.max}</p>)}
        
        <label htmlFor="resched-status">Status</label>
        <select id="resched-status" value={status} onChange={(e) => setStatus(e.target.value)} required className={styles.input}>
          <option value="agendado">Agendado</option>
          <option value="concluído">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        
        <label htmlFor="resched-descricao">Descrição (Opcional)</label>
        <input id="resched-descricao" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Retorno" className={styles.input} />
        
        {error && <p className={styles.error} role="alert">{error}</p>}
        {serverError && <p className={styles.error} role="alert">{serverError}</p>}
        <button type="submit" disabled={isLoading} className={styles.button}>{isLoading ? 'Salvando...' : 'Confirmar Alterações'}</button>
      </form>
    </div>
  );
};

const ViewManageAppointments = ({ token, setNotification, onStartAlter }) => {
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchBookedAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllBookedAppointments(token);
      const appointmentsArray = Array.isArray(data) ? data : [];
      const sortedData = appointmentsArray.sort((a, b) => {
        const dateComparison = (b.date || '').localeCompare(a.date || '');
        if (dateComparison !== 0) return dateComparison;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
      setBookedAppointments(sortedData);
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Falha ao carregar consultas agendadas.");
      setNotification({ type: 'error', message: friendlyError });
    } finally { setIsLoading(false); }
  }, [token, setNotification]);

  useEffect(() => { fetchBookedAppointments(); }, [fetchBookedAppointments]);

  const handleCancelAppointment = (appointmentId) => {
    if (!appointmentId) return;
    setNotification(null);
    setModalState({ 
      isOpen: true, 
      title: 'Confirmar Cancelamento', 
      message: 'Você tem certeza que deseja CANCELAR esta consulta? Esta ação não pode ser desfeita.', 
      onConfirm: () => executeCancelAppointment(appointmentId) 
    });
  };

  const executeCancelAppointment = async (appointmentId) => {
    setIsLoadingCancel(true); closeModal();
    try {
      await cancelAppointmentById(appointmentId, token);
      setNotification({ type: 'success', message: 'Consulta cancelada com sucesso!' });
      setBookedAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: 'cancelado' } : app));
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Falha ao cancelar a consulta.");
      setNotification({ type: 'error', message: friendlyError });
    } finally { setIsLoadingCancel(false); }
  };
  
  const closeModal = () => { if (isLoadingCancel) return; setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} }); };

  return (
    <div>
      <h2 id="content-title">Consultas Agendadas</h2>
      {isLoading && bookedAppointments.length === 0 && <p>Carregando consultas...</p>}
      <BookedAppointmentsList 
        appointments={bookedAppointments} 
        onReschedule={onStartAlter} 
        onCancel={handleCancelAppointment} 
        isLoading={isLoading || isLoadingCancel} 
      />
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        isLoading={isLoadingCancel}
      />
    </div>
  );
};

const ViewReports = ({ token, setNotification }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctors, setDoctors] = useState([]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllBookedAppointments(token);
      const appointmentsArray = Array.isArray(data) ? data : [];
      setAppointments(appointmentsArray);

      const uniqueDoctors = [];
      const doctorMap = new Map();
      appointmentsArray.forEach(app => {
        if (app.doctor && !doctorMap.has(app.doctor.id)) {
          doctorMap.set(app.doctor.id, true);
          uniqueDoctors.push(app.doctor);
        }
      });
      setDoctors(uniqueDoctors);

    } catch (err) {
      setNotification({ type: 'error', message: "Erro ao carregar dados para relatório." });
    } finally {
      setIsLoading(false);
    }
  }, [token, setNotification]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appMonth = app.date ? app.date.slice(0, 7) : '';
      const monthMatch = appMonth === selectedMonth;
      const doctorMatch = selectedDoctor ? app.doctor?.id === selectedDoctor : true;
      return monthMatch && doctorMatch;
    });
  }, [appointments, selectedMonth, selectedDoctor]);

  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const completed = filteredAppointments.filter(a => a.status === 'concluído').length;
    const cancelled = filteredAppointments.filter(a => a.status === 'cancelado').length;
    const scheduled = filteredAppointments.filter(a => a.status === 'agendado').length;
    return { total, completed, cancelled, scheduled };
  }, [filteredAppointments]);

  const pieChartStyle = useMemo(() => {
    const total = stats.total || 1;
    const pCompleted = (stats.completed / total) * 100;
    const pCancelled = (stats.cancelled / total) * 100;
    const pScheduled = (stats.scheduled / total) * 100;

    const endCompleted = pCompleted;
    const endCancelled = pCompleted + pCancelled;

    return {
      background: `conic-gradient(
        #28a745 0% ${endCompleted}%,
        #dc3545 ${endCompleted}% ${endCancelled}%,
        #007bff ${endCancelled}% 100%
      )`
    };
  }, [stats]);

  const generateExcel = () => {
    const title = [['Relatório Mensal de Consultas']];
    const info = [
        ['Mês:', selectedMonth],
        ['Dentista:', selectedDoctor ? doctors.find(d => d.id === selectedDoctor)?.username : 'Todos']
    ];
    const summaryHeader = [['Resumo:']];
    const summaryData = [
        ['Total', stats.total],
        ['Concluídas', stats.completed],
        ['Canceladas', stats.cancelled],
        ['Agendadas', stats.scheduled]
    ];
    const tableHeader = [['Data', 'Doutor', 'Paciente', 'Status']];
    const tableData = filteredAppointments.map(app => [
        app.date ? new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
        app.doctor?.username,
        app.patient?.username,
        app.status
    ]);

    const worksheetData = [
        ...title, [],
        ...info, [],
        ...summaryHeader,
        ...summaryData, [],
        ...tableHeader,
        ...tableData
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `Relatorio_${selectedMonth}.xlsx`);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 id="content-title">Relatório Mensal de Consultas</h2>
        {stats.total > 0 && (
            <button onClick={generateExcel} className={styles.exportButton}>Exportar Excel</button>
        )}
      </div>
      
      <div className={styles.filterContainer}>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)} 
          className={styles.filterInput}
          aria-label="Selecionar Mês"
        />
        <select 
          value={selectedDoctor} 
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className={styles.filterInput}
          aria-label="Filtrar por Dentista"
        >
          <option value="">Todos os Dentistas</option>
          {doctors.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.username}</option>
          ))}
        </select>
      </div>

      {isLoading ? <p>Gerando relatório...</p> : (
        <div>
          <div className={styles.chartContainer}>
            <div className={styles.chartContent}>
                <div className={styles.pieChart} style={pieChartStyle}></div>
                <div className={styles.chartLegend}>
                    <div className={styles.legendItem}><div className={styles.colorDot} style={{background: '#28a745'}}></div> Concluídas ({stats.completed})</div>
                    <div className={styles.legendItem}><div className={styles.colorDot} style={{background: '#dc3545'}}></div> Canceladas ({stats.cancelled})</div>
                    <div className={styles.legendItem}><div className={styles.colorDot} style={{background: '#007bff'}}></div> Agendadas ({stats.scheduled})</div>
                    <div className={styles.legendItem} style={{fontWeight: 'bold', marginTop: '5px'}}>Total: {stats.total}</div>
                </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr><th>Data</th><th>Doutor</th><th>Paciente</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredAppointments.map(app => (
                  <tr key={app.id}>
                    <td data-label="Data">{app.date ? new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td data-label="Doutor">{app.doctor?.username}</td>
                    <td data-label="Paciente">{app.patient?.username}</td>
                    <td data-label="Status" className={styles[`status-${app.status}`]}>{app.status}</td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center'}}>Nenhum dado encontrado para este período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewRegisterClient = ({ token, setNotification, onClientCreated }) => {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 id="content-title">Cadastrar Novo Paciente</h2>
      </div>
      <CreateUserForm
        userType="Paciente"
        apiService={(data) => createClient(data, token)}
        requiredFields={['username', 'email', 'telephone', 'password']}
        onUserCreated={() => {
          setNotification({ type: 'success', message: "Paciente cadastrado com sucesso! Agora você pode agendar a consulta para ele." });
          onClientCreated();
        }}
      />
    </div>
  );
};

const ViewCreateAppointment = ({ token, setNotification, onAppointmentCreated }) => {
  const [allSchedules, setAllSchedules] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const fetchAvailableSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableSchedules(token);
      const schedulesArray = Array.isArray(data) ? data : [];
      const doctorsMap = new Map();
      const enrichedAvailable = schedulesArray.map(schedule => {
        const doctorInfo = schedule?.doctor;
        if (doctorInfo?.id && doctorInfo.username && !doctorsMap.has(doctorInfo.id)) { doctorsMap.set(doctorInfo.id, doctorInfo); }
        return { ...schedule, doctor: doctorInfo || null, appointments: schedule.appointments || [] };
      });
      setAllSchedules(enrichedAvailable);
      setAvailableDoctors(Array.from(doctorsMap.values()).sort((a,b) => (a.username || '').localeCompare(b.username || '')));
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Falha ao carregar vagas disponíveis.");
      setNotification({ type: 'error', message: friendlyError });
    } finally { setIsLoading(false); }
  }, [token, setNotification]);

  useEffect(() => { fetchAvailableSchedules(); }, [fetchAvailableSchedules]);

  const filteredAvailableSchedules = useMemo(() => {
    return allSchedules.filter(schedule => {
      const dateMatch = !dateFilter || (schedule?.dayOfWeek ?? '') === dateFilter;
      const doctorMatch = !doctorFilter || (schedule?.doctor?.id ?? null) == doctorFilter;
      return dateMatch && doctorMatch;
    });
  }, [allSchedules, dateFilter, doctorFilter]);
  
  const groupedAvailableSchedules = useMemo(() => {
    return filteredAvailableSchedules.reduce((acc, schedule) => {
      const date = schedule?.dayOfWeek;
      if (!date) return acc;
      if (!acc[date]) acc[date] = [];
      acc[date].push(schedule);
      acc[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return acc;
    }, {});
  }, [filteredAvailableSchedules]);

  const handleClearFilters = () => {
    setDateFilter(''); setDoctorFilter('');
    const dateInput = document.querySelector(`.${styles.filterContainer} input[type="date"]`);
    const doctorSelect = document.querySelector(`.${styles.filterContainer} select`);
    if (dateInput) dateInput.value = '';
    if (doctorSelect) doctorSelect.value = '';
  };

  const handleCreateAppointmentSubmit = async (appointmentData) => {
    setServerError(null); setIsSubmitting(true);
    try {
      if (!selectedSchedule?.id) throw new Error("Agenda não selecionada.");
      await createAppointment(selectedSchedule.id, appointmentData, token);
      setNotification({ type: 'success', message: 'Consulta agendada com sucesso!' });
      onAppointmentCreated();
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Não foi possível criar o agendamento.");
      setServerError(friendlyError);
    } finally { setIsSubmitting(false); }
  };

  if (selectedSchedule) {
    return <AppointmentForm 
      schedule={selectedSchedule} 
      onSubmit={handleCreateAppointmentSubmit} 
      onBack={() => { setSelectedSchedule(null); setServerError(null); }} 
      isLoading={isSubmitting} 
      serverError={serverError} 
    />;
  }
  
  return (
    <div>
      <h2 id="content-title">Agendar Nova Consulta</h2>
      <p>Selecione uma vaga disponível abaixo.</p>
      <ScheduleFilters 
        doctors={availableDoctors} 
        onDateChange={setDateFilter} 
        onDoctorChange={setDoctorFilter} 
        onClearFilters={handleClearFilters} 
      />
      {isLoading && <p>Carregando vagas...</p>}
      <SchedulesList 
        groupedSchedules={groupedAvailableSchedules} 
        onSelectSchedule={schedule => { setSelectedSchedule(schedule); setServerError(null); }} 
        selectable={true} 
      />
    </div>
  );
};

const ViewAlterAppointment = ({ token, setNotification, appointment, onCancelAlter, onAlterSuccess }) => {
  const [internalView, setInternalView] = useState('editDetails');
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [allSchedules, setAllSchedules] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [selectedScheduleForAlterar, setSelectedScheduleForAlterar] = useState(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const fetchAvailableSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const data = await getAvailableSchedules(token);
      const schedulesArray = Array.isArray(data) ? data : [];
      const doctorsMap = new Map();
      const enrichedAvailable = schedulesArray.map(schedule => {
        const doctorInfo = schedule?.doctor;
        if (doctorInfo?.id && doctorInfo.username && !doctorsMap.has(doctorInfo.id)) { doctorsMap.set(doctorInfo.id, doctorInfo); }
        return { ...schedule, doctor: doctorInfo || null, appointments: schedule.appointments || [] };
      });
      setAllSchedules(enrichedAvailable);
      setAvailableDoctors(Array.from(doctorsMap.values()).sort((a,b) => (a.username || '').localeCompare(b.username || '')));
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Falha ao carregar vagas disponíveis.");
      setServerError(friendlyError);
    } finally { setIsLoadingSchedules(false); }
  }, [token]);

  const filteredAvailableSchedules = useMemo(() => {
    return allSchedules.filter(schedule => {
      const dateMatch = !dateFilter || (schedule?.dayOfWeek ?? '') === dateFilter;
      const doctorMatch = !doctorFilter || (schedule?.doctor?.id ?? null) == doctorFilter;
      const isOriginalSlot = appointment?.scheduleId && (schedule?.id ?? null) === appointment.scheduleId;
      return dateMatch && doctorMatch && !isOriginalSlot;
    });
  }, [allSchedules, dateFilter, doctorFilter, appointment]);
  
  const groupedAvailableSchedules = useMemo(() => {
    return filteredAvailableSchedules.reduce((acc, schedule) => {
      const date = schedule?.dayOfWeek;
      if (!date) return acc;
      if (!acc[date]) acc[date] = [];
      acc[date].push(schedule);
      acc[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return acc;
    }, {});
  }, [filteredAvailableSchedules]);

  const handleClearFilters = () => {
    setDateFilter(''); setDoctorFilter('');
    const dateInput = document.querySelector(`.${styles.filterContainer} input[type="date"]`);
    const doctorSelect = document.querySelector(`.${styles.filterContainer} select`);
    if (dateInput) dateInput.value = '';
    if (doctorSelect) doctorSelect.value = '';
  };

  const handleGoToSelectSlot = () => {
    setInternalView('selectSlot'); setServerError(null); handleClearFilters();
    if (allSchedules.length === 0) { fetchAvailableSchedules(); }
  };
  
  const handleSelectScheduleForAlterar = (newSchedule) => {
    setSelectedScheduleForAlterar(newSchedule);
    setInternalView('editDetails');
    setServerError(null);
  };

  const handleOpenAlterarConfirm = (updatedDataFromForm) => {
    setServerError(null);
    setModalState({
      isOpen: true,
      title: 'Confirmar Alteração',
      message: 'Você tem certeza que deseja salvar estas alterações na consulta?',
      onConfirm: () => executeAlterarSubmit(updatedDataFromForm)
    });
  };

  const executeAlterarSubmit = async (updatedDataFromForm) => {
    setIsSubmitting(true); closeModal();
    try {
      if (!appointment?.id) throw new Error("Erro interno: Consulta a alterar não encontrada.");
      await updateAppointment(appointment.id, updatedDataFromForm, token);
      setNotification({ type: 'success', message: 'Consulta atualizada com sucesso!' });
      onAlterSuccess();
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Não foi possível salvar as alterações.");
      setServerError(friendlyError);
    } finally { setIsSubmitting(false); }
  };
  
  const closeModal = () => { if (isSubmitting) return; setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} }); };

  if (internalView === 'selectSlot') {
    return (
      <div>
        <button onClick={() => setInternalView('editDetails')} className={styles.backButton}>← Voltar para Edição</button>
        <h3 id="content-title">Selecionar Nova Vaga</h3>
        <p>Selecione uma nova vaga disponível para a consulta de <strong>{appointment?.patient?.username}</strong>.</p>
        {serverError && <p className={styles.error} role="alert">{serverError}</p>}
        <ScheduleFilters 
          doctors={availableDoctors} 
          onDateChange={setDateFilter} 
          onDoctorChange={setDoctorFilter} 
          onClearFilters={handleClearFilters} 
        />
        {isLoadingSchedules && <p>Carregando vagas...</p>}
        <SchedulesList 
          groupedSchedules={groupedAvailableSchedules} 
          onSelectSchedule={handleSelectScheduleForAlterar} 
          selectable={true} 
        />
      </div>
    );
  }

  return (
    <div>
      <AlterarEditForm
        appointment={appointment}
        newlySelectedSchedule={selectedScheduleForAlterar}
        onOpenConfirm={handleOpenAlterarConfirm}
        onCancel={onCancelAlter}
        onGoToSelectSlot={handleGoToSelectSlot}
        isLoading={isSubmitting}
        serverError={serverError}
      />
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        isLoading={isSubmitting}
      />
    </div>
  );
};

const SecretaryDashboard = () => {
  const { user, token } = useAuth();
  const [activeView, setActiveView] = useState('manageAppointments');
  const [notification, setNotification] = useState(null);
  const clearNotification = useCallback(() => setNotification(null), []);
  const [appointmentToAlter, setAppointmentToAlter] = useState(null);

  const handleClientCreated = () => { setActiveView('createAppointment'); };
  const handleAppointmentCreated = () => { setActiveView('manageAppointments'); };
  const handleStartAlter = (appointment) => { setAppointmentToAlter(appointment); setActiveView('alterAppointment'); clearNotification(); };
  const handleCancelAlter = () => { setAppointmentToAlter(null); setActiveView('manageAppointments'); clearNotification(); };
  const handleAlterSuccess = () => { setAppointmentToAlter(null); setActiveView('manageAppointments'); };

  const renderActiveView = () => {
    switch (activeView) {
      case 'registerClient':
        return (<ViewRegisterClient token={token} setNotification={setNotification} onClientCreated={handleClientCreated} />);
      case 'createAppointment':
        return (<ViewCreateAppointment token={token} setNotification={setNotification} onAppointmentCreated={handleAppointmentCreated} />);
      case 'alterAppointment':
        if (!appointmentToAlter) { handleCancelAlter(); return null; }
        return (<ViewAlterAppointment token={token} setNotification={setNotification} appointment={appointmentToAlter} onCancelAlter={handleCancelAlter} onAlterSuccess={handleAlterSuccess} />);
      case 'reports':
        return (<ViewReports token={token} setNotification={setNotification} />);
      case 'manageAppointments':
      default:
        return (<ViewManageAppointments token={token} setNotification={setNotification} onStartAlter={handleStartAlter} />);
    }
  };
  
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sideMenu}>
        <div className={styles.welcomeMessage}><p>Bem-vindo(a),</p><strong>{user?.username || 'Secretária'}</strong></div>
        <nav className={styles.nav} aria-label="Menu principal da secretária">
          <button
            className={`${styles.menuButton} ${['manageAppointments', 'alterAppointment'].includes(activeView) ? styles.active : ''}`}
            onClick={() => { setActiveView('manageAppointments'); setAppointmentToAlter(null); clearNotification(); }}
            aria-current={['manageAppointments', 'alterAppointment'].includes(activeView) ? 'page' : undefined}
          >
            Consultas Agendadas
          </button>
          <button
            className={`${styles.menuButton} ${activeView === 'createAppointment' ? styles.active : ''}`}
            onClick={() => { setActiveView('createAppointment'); clearNotification(); }}
            aria-current={activeView === 'createAppointment' ? 'page' : undefined}
          >
            Agendar Nova Consulta
          </button>
          <button
            className={`${styles.menuButton} ${activeView === 'registerClient' ? styles.active : ''}`}
            onClick={() => { setActiveView('registerClient'); clearNotification(); }}
            aria-current={activeView === 'registerClient' ? 'page' : undefined}
          >
            Cadastrar Paciente
          </button>
          <button
            className={`${styles.menuButton} ${activeView === 'reports' ? styles.active : ''}`}
            onClick={() => { setActiveView('reports'); clearNotification(); }}
            aria-current={activeView === 'reports' ? 'page' : undefined}
          >
            Relatórios
          </button>
        </nav>
      </aside>
      <main className={styles.contentArea} aria-labelledby="content-title">
        <Notification notification={notification} onClose={clearNotification} />
        {renderActiveView()}
      </main>
    </div>
  );
};

export default SecretaryDashboard;