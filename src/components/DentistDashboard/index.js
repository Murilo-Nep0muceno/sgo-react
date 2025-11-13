import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  createSchedule,
  getMySchedules,
  getDoctorAppointments,
  createObservation
} from '../../services/adminService';
import { translateErrorMessage } from '../helpers/errorTranslator';
import styles from './DentistDashboard.module.css';
import { FiMail, FiMessageSquare } from 'react-icons/fi';

// ... (Mantenha os componentes Notification, ObservationForm, useCalendar, MonthView, WeekView, AgendaView, CreateScheduleView do código anterior)
// Como você pediu "do zero ao todo", vou colocar o arquivo inteiro abaixo para garantir que nada falte.

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

const ObservationForm = ({ appointment, onSubmit, onClose, isLoading, serverError }) => {
  const [diagnostic, setDiagnostic] = useState('');
  const [procedures, setProcedures] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [examFile, setExamFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError('');
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Tipo de arquivo inválido. Use JPG, PNG ou PDF.');
        setExamFile(null); return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError('Arquivo muito grande (Máx 5MB).');
        setExamFile(null); return;
      }
      setExamFile(file);
    } else {
      setExamFile(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const observationData = { diagnostic, procedures, recommendations };
    onSubmit(observationData, examFile);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="obs-form-title">
        <div className={styles.modalHeader}>
          <h3 id="obs-form-title">Registrar Prontuário</h3>
          <p>Paciente: <strong>{appointment?.patient?.username || 'N/A'}</strong></p>
          <p>Data: {new Date(`${appointment?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} ({(appointment?.startTime || '').slice(0, 5)} - {(appointment?.endTime || '').slice(0, 5)})</p>
          <button onClick={onClose} className={styles.modalCloseButton} disabled={isLoading} aria-label="Fechar modal">×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="diagnostic">Diagnóstico:</label>
          <textarea
            id="diagnostic"
            value={diagnostic}
            onChange={(e) => setDiagnostic(e.target.value)}
            rows="3"
            className={styles.textarea}
            placeholder="Ex: Cárie no elemento 26..."
            autoFocus
          />

          <label htmlFor="procedures">Procedimentos Realizados:</label>
          <textarea
            id="procedures"
            value={procedures}
            onChange={(e) => setProcedures(e.target.value)}
            rows="4"
            className={styles.textarea}
            placeholder="Ex: Restauração em resina composta..."
          />

          <label htmlFor="recommendations">Recomendações:</label>
          <textarea
            id="recommendations"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows="2"
            className={styles.textarea}
            placeholder="Ex: Evitar alimentos duros por 24h..."
          />

          <label htmlFor="examFile">Anexar Exame (Opcional - JPG, PNG, PDF - Máx 5MB):</label>
          <input
            id="examFile"
            type="file"
            onChange={handleFileChange}
            accept=".jpg, .jpeg, .png, .pdf"
            className={styles.inputFile}
          />
          {fileError && <p className={styles.errorText} role="alert">{fileError}</p>}
          {examFile && <p className={styles.fileName}>Arquivo: {examFile.name}</p>}

          {serverError && <p className={styles.errorText} role="alert">{serverError}</p>}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.secondaryButton} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className={styles.button} disabled={isLoading || !!fileError}>
              {isLoading ? 'Salvando...' : 'Salvar Prontuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const useCalendar = (token) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rawSchedules, setRawSchedules] = useState([]);
  const [rawAppointments, setRawAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setError("Token não fornecido.");
      return;
    }
    setIsLoading(true);
    try {
      setError(null);
      const [scheduleList, appointmentList] = await Promise.all([
        getMySchedules(token),
        getDoctorAppointments(token)
      ]);
      setRawSchedules(scheduleList || []);
      setRawAppointments(appointmentList || []);
    } catch (err) {
      console.error("Falha ao buscar dados da agenda:", err);
      setError(err.message || "Não foi possível carregar os dados da agenda.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const schedules = useMemo(() =>
    rawSchedules.map(schedule => ({
      ...schedule,
      dateObj: new Date(`${schedule.dayOfWeek}T00:00:00Z`)
    })).sort((a, b) => a.dateObj - b.dateObj),
    [rawSchedules]
  );

  const appointments = useMemo(() =>
    rawAppointments
      .filter(appointment => appointment.status !== 'cancelado')
      .map(appointment => ({
        ...appointment,
        dateObj: new Date(`${appointment.date}T00:00:00Z`)
      }))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    [rawAppointments]);

  const changeMonth = useCallback((amount) => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + amount, 1); return d; }), []);
  const changeWeek = useCallback((amount) => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + (7 * amount)); return d; }), []);
  const changeDay = useCallback((amount) => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + amount); return d; }), []);
  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  return {
    currentDate, setCurrentDate,
    schedules, appointments,
    rawAppointments,
    fetchData,
    changeMonth, changeWeek, changeDay, goToToday,
    error, isLoading
  };
};

const MonthView = ({ calendar, onDayClick, onAppointmentClick }) => {
  const monthGrid = useMemo(() => {
    if (!calendar?.currentDate) return [];
    const year = calendar.currentDate.getFullYear();
    const month = calendar.currentDate.getMonth();
    const grid = [];
    let day = new Date(year, month, 1);
    day.setDate(day.getDate() - day.getDay());
    for (let i = 0; i < 42; i++) {
      const dateStr = day.toISOString().split('T')[0];
      grid.push({
        date: new Date(day),
        appointments: calendar.appointments?.filter(a => a.date === dateStr) || [],
        schedules: calendar.schedules?.filter(s => s.dayOfWeek === dateStr) || [],
        isCurrentMonth: day.getMonth() === month
      });
      day.setDate(day.getDate() + 1);
    }
    return grid;
  }, [calendar.currentDate, calendar.schedules, calendar.appointments]);

  const handleKeyPress = (e, callback, ...args) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(...args);
    }
  };

  return (
    <div className={`${styles.calendarGrid} ${styles.monthView}`}>
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className={styles.gridHeader}>{day}</div>)}
      {monthGrid.map((day, i) => {
        const dayLabel = `Dia ${day.date.getDate()}, ${day.appointments.length} consulta(s). Clique para ver a agenda do dia.`;
        return (
          <div key={i}
            role="button"
            tabIndex={0}
            onClick={() => onDayClick(day.date)}
            onKeyPress={(e) => handleKeyPress(e, onDayClick, day.date)}
            aria-label={dayLabel}
            className={`${styles.dayCell} ${!day.isCurrentMonth ? styles.notCurrentMonth : ''} ${day.date.toDateString() === new Date().toDateString() ? styles.today : ''}`}>
            <span>{day.date.getDate()}</span>
            {day.appointments.map(a => {
              const appLabel = `Paciente: ${a.patient?.username}, Status: ${a.status}. Clique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`;
              return (
                <div key={`a-${a.id}`}
                  role="button"
                  tabIndex={0}
                  className={`${styles.appointmentItemMonth} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
                  aria-label={appLabel}
                  onClick={(e) => { e.stopPropagation(); onAppointmentClick(a); }}
                  onKeyPress={(e) => { e.stopPropagation(); handleKeyPress(e, onAppointmentClick, a); }}
                >
                  {a.patient?.username || 'Paciente'}
                </div>
              );
            })}
            {day.schedules.length > 0 && day.appointments.length === 0 &&
              <div className={styles.scheduleItem}>Disponível</div>
            }
          </div>
        );
      })}
    </div>
  );
};

const WeekView = ({ calendar, onDayClick, onAppointmentClick }) => {
  const weekGrid = useMemo(() => {
    if (!calendar?.currentDate) return [];
    const grid = [];
    let day = new Date(calendar.currentDate);
    day.setDate(day.getDate() - day.getDay());
    
    for (let i = 0; i < 7; i++) {
      const dateStr = day.toISOString().split('T')[0];
      grid.push({
        date: new Date(day),
        appointments: calendar.appointments?.filter(a => a.date === dateStr) || [],
        schedules: calendar.schedules?.filter(s => s.dayOfWeek === dateStr) || [],
        isToday: day.toDateString() === new Date().toDateString()
      });
      day.setDate(day.getDate() + 1);
    }
    return grid;
  }, [calendar.currentDate, calendar.schedules, calendar.appointments]);

  const handleKeyPress = (e, callback, ...args) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(...args);
    }
  };

  return (
    <div className={`${styles.calendarGrid} ${styles.weekView}`}>
      {weekGrid.map((day, i) => (
        <div key={i} className={styles.dayColumn}>
          <div
            role="button"
            tabIndex={0}
            className={`${styles.gridHeader} ${day.isToday ? styles.today : ''}`}
            onClick={() => onDayClick(day.date)}
            onKeyPress={(e) => handleKeyPress(e, onDayClick, day.date)}
            aria-label={`Ver agenda do dia ${day.date.toLocaleDateString('pt-BR')}`}
          >
            {day.date.toLocaleDateString('pt-BR', { weekday: 'short' })} {day.date.getDate()}
          </div>
          <div className={styles.dayContent}>
            {day.appointments.map(a => {
              const appLabel = `Paciente: ${a.patient?.username}, Status: ${a.status}. Clique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`;
              return (
                <div key={`a-${a.id}`}
                  role="button"
                  tabIndex={0}
                  className={`${styles.appointmentItem} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
                  onClick={() => onAppointmentClick(a)}
                  onKeyPress={(e) => handleKeyPress(e, onAppointmentClick, a)}
                  aria-label={appLabel}
                >
                  <p className={styles.appointmentTime}>{(a.startTime || '').slice(0, 5)} - {(a.endTime || '').slice(0, 5)}</p>
                  <p className={styles.patientName}>{a.patient?.username || 'Paciente'}</p>
                </div>
              );
            })}
            {day.schedules.length > 0 && day.appointments.length === 0 && (
              day.schedules.map(s => (
                <div key={`s-${s.id}`} className={styles.scheduleItem}>
                  <p>Disponível</p>
                  <p className={styles.scheduleTime}>{(s.startTime || '').slice(0, 5)} - {(s.endTime || '').slice(0, 5)}</p>
                </div>
              ))
            )}
            {day.schedules.length === 0 && day.appointments.length === 0 && (
              <div className={styles.noItems}>Sem horários</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const AgendaView = ({ calendar, onAppointmentClick }) => {
  const appointmentsForDay = useMemo(() => {
    if (!calendar?.currentDate) return [];
    const dateStr = calendar.currentDate.toISOString().split('T')[0];
    return calendar.appointments?.filter(a => a.date === dateStr) || [];
  }, [calendar.currentDate, calendar.appointments]);

  const handleKeyPress = (e, callback, ...args) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback(...args);
    }
  };

  return (
    <div className={styles.agendaContainer}>
      {appointmentsForDay.length > 0 ? (
        appointmentsForDay.map(a => {
          const appLabel = `Paciente: ${a.patient?.username}, Status: ${a.status}. Clique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`;
          return (
            <div key={a.id}
              className={`${styles.appointmentCard} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
              onClick={() => onAppointmentClick(a)}
              onKeyPress={(e) => handleKeyPress(e, onAppointmentClick, a)}
              role="button"
              tabIndex={0}
              aria-label={appLabel}
            >
              <div className={styles.timeInfo}>
                <span>{(a.startTime || '').slice(0, 5)}</span>
                <span>{(a.endTime || '').slice(0, 5)}</span>
              </div>
              <div className={styles.details}>
                <h4>{a.patient?.username || 'Paciente'}</h4>
                <p>{a.descricao || 'Consulta de rotina'}</p>
                <span className={styles.addObservationHint}>+ {a.status === 'concluído' ? 'Ver' : 'Adicionar'} Prontuário</span>
              </div>
            </div>
          );
        })
      ) : (
        <p className={styles.infoText}>Nenhuma consulta marcada para este dia.</p>
      )}
    </div>
  );
};

const CreateScheduleView = ({ onScheduleCreated, token, existingSchedules, setNotification }) => {
  const [mode, setMode] = useState('day');
  const [isLoading, setIsLoading] = useState(false);
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const [weekdays, setWeekdays] = useState({
    1: { enabled: true, startTime: '08:00', endTime: '17:00', name: 'Segunda' },
    2: { enabled: true, startTime: '08:00', endTime: '17:00', name: 'Terça' },
    3: { enabled: true, startTime: '08:00', endTime: '17:00', name: 'Quarta' },
    4: { enabled: true, startTime: '08:00', endTime: '17:00', name: 'Quinta' },
    5: { enabled: true, startTime: '08:00', endTime: '17:00', name: 'Sexta' },
    6: { enabled: false, startTime: '09:00', endTime: '12:00', name: 'Sábado' },
    0: { enabled: false, startTime: '09:00', endTime: '12:00', name: 'Domingo' },
  });

  const existingScheduleDates = useMemo(() => new Set(
    (existingSchedules || []).map(s => s.dayOfWeek)
  ), [existingSchedules]);

  const handleWeekdayChange = (day, field, value) => {
    setWeekdays(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const getDatesForMode = () => {
    const dates = [];
    if (mode === 'day') {
      if (singleDate) dates.push(singleDate);
    } else if (mode === 'week' && selectedWeek) {
      const [year, weekNum] = selectedWeek.split('-W');
      const d = new Date(year, 0, 4);
      d.setDate(d.getDate() - (d.getDay() || 7) + 1);
      d.setDate(d.getDate() + (weekNum - 1) * 7);
      
      for (let i = 0; i < 7; i++) {
        dates.push(new Date(d).toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }
    } else if (mode === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const d = new Date(year, parseInt(month) - 1, 1);
      const daysInMonth = new Date(year, parseInt(month), 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        dates.push(new Date(d).toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }
    }
    return dates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
    let payloads = [];
    let errors = [];

    try {
      const datesToCreate = getDatesForMode();
      if (datesToCreate.length === 0) {
        throw new Error("Por favor, selecione uma data, semana ou mês válido.");
      }

      for (const dateStr of datesToCreate) {
        const dateObj = new Date(dateStr + 'T00:00:00Z');
        const dayOfWeek = dateObj.getUTCDay();
        const dayConfig = weekdays[dayOfWeek];

        if (dayConfig?.enabled) {
          if (existingScheduleDates.has(dateStr)) {
            errors.push(`Agenda para ${dateStr} já existe.`);
          } else if (dayConfig.startTime >= dayConfig.endTime) {
            errors.push(`Horário inválido para ${dateStr} (Início deve ser antes do Fim).`);
          } else {
            payloads.push({
              dayOfWeek: dateStr,
              startTime: dayConfig.startTime,
              endTime: dayConfig.endTime
            });
          }
        }
      }

      if (errors.length > 0) throw new Error(errors.join('\n'));
      if (payloads.length === 0) throw new Error('Nenhuma nova agenda para criar. Verifique os dias selecionados e possíveis conflitos.');

      await Promise.all(payloads.map(payload => createSchedule(payload, token)));
      
      setNotification({ type: 'success', message: `${payloads.length} agenda(s) criada(s) com sucesso! Redirecionando...` });
      setTimeout(() => onScheduleCreated && onScheduleCreated(), 2000);
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, "Erro ao criar agenda(s).");
      setNotification({ type: 'error', message: friendlyError });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormContent = () => {
    switch (mode) {
      case 'day':
        return (
          <div className={styles.formGroup}>
            <label htmlFor="singleDate" className={styles.label}>Data Específica:</label>
            <input
              id="singleDate"
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={styles.input}
            />
          </div>
        );
      case 'week':
        return (
          <div className={styles.formGroup}>
            <label htmlFor="selectedWeek" className={styles.label}>Semana:</label>
            <input
              id="selectedWeek"
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className={styles.input}
            />
          </div>
        );
      case 'month':
        return (
          <div className={styles.formGroup}>
            <label htmlFor="selectedMonth" className={styles.label}>Mês:</label>
            <input
              id="selectedMonth"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.input}
            />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={styles.createScheduleContainer}>
      <div className={styles.pageHeader}>
        <h2>Criar Nova Agenda</h2>
      </div>
      <p>Configure os horários de atendimento padrão para os dias da semana e, em seguida, escolha como deseja aplicar (dia, semana ou mês).</p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset className={styles.weekdaysConfig}>
          <legend><h4>Horários Padrão da Semana</h4></legend>
          {Object.entries(weekdays).map(([dayKey, config]) => (
            <div key={dayKey} className={`${styles.weekdayRow} ${config.enabled ? styles.enabled : ''}`}>
              <div className={styles.weekdayRowTop}>
                <label htmlFor={`check-${dayKey}`} className={styles.weekdayCheckboxLabel}>
                  <input
                    type="checkbox"
                    id={`check-${dayKey}`}
                    checked={config.enabled}
                    onChange={(e) => handleWeekdayChange(dayKey, 'enabled', e.target.checked)}
                  />
                  <span className={styles.weekdayLabel}>{config.name}</span>
                </label>
              </div>
              <div className={styles.weekdayRowBottom}>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => handleWeekdayChange(dayKey, 'startTime', e.target.value)}
                  disabled={!config.enabled}
                  className={styles.inputTime}
                  aria-label={`Horário de início para ${config.name}`}
                />
                <span>às</span>
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => handleWeekdayChange(dayKey, 'endTime', e.target.value)}
                  disabled={!config.enabled}
                  className={styles.inputTime}
                  aria-label={`Horário de término para ${config.name}`}
                />
              </div>
            </div>
          ))}
        </fieldset>

        <div role="tablist" className={styles.tabButtons}>
          <button type="button" role="tab" aria-selected={mode === 'day'} onClick={() => setMode('day')} className={mode === 'day' ? styles.active : ''}>Dia Específico</button>
          <button type="button" role="tab" aria-selected={mode === 'week'} onClick={() => setMode('week')} className={mode === 'week' ? styles.active : ''}>Semana Inteira</button>
          <button type="button" role="tab" aria-selected={mode === 'month'} onClick={() => setMode('month')} className={mode === 'month' ? styles.active : ''}>Mês Inteiro</button>
        </div>
        
        {renderFormContent()}

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Criando...' : `Criar Agenda(s)`}
        </button>
      </form>
    </div>
  );
};

const PatientListView = ({ rawAppointments }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const uniquePatients = useMemo(() => {
    const patientMap = new Map();
    rawAppointments.forEach(app => {
      if (app.patient && !patientMap.has(app.patient.id)) {
        patientMap.set(app.patient.id, app.patient);
      }
    });
    return Array.from(patientMap.values());
  }, [rawAppointments]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return uniquePatients;
    const lowerTerm = searchTerm.toLowerCase();
    
    return uniquePatients.filter(patient => {
      const nameMatch = patient.username.toLowerCase().includes(lowerTerm);
      const emailMatch = patient.email && patient.email.toLowerCase().includes(lowerTerm);
      return nameMatch || emailMatch;
    });
  }, [uniquePatients, searchTerm]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Meus Pacientes</h2>
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar paciente por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Buscar pacientes"
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.userTable} role="table">
          <thead>
            <tr>
              <th>Nome do Paciente</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(patient => (
              <tr key={patient.id}>
                <td data-label="Nome">{patient.username}</td>
                <td data-label="Email">{patient.email || 'N/A'}</td>
                <td data-label="Telefone">{patient.telephone || 'N/A'}</td>
                <td data-label="Ações" className={styles.actionsCell}>
                  <button 
                    className={`${styles.iconButton} ${styles.email}`} 
                    title="Enviar Email" 
                    aria-label={`Enviar email para ${patient.username}`}
                    onClick={() => window.location.href = `mailto:${patient.email}`}
                  >
                    <FiMail />
                    <span>Email</span>
                  </button>

                  <button 
                    className={`${styles.iconButton} ${styles.whatsapp}`} 
                    title="Enviar Mensagem" 
                    aria-label={`Enviar mensagem para ${patient.username}`}
                    onClick={() => {
                        if(patient.telephone) {
                            const num = patient.telephone.replace(/\D/g,'');
                            window.open(`https://wa.me/55${num}`, '_blank');
                        }
                    }}
                  >
                    <FiMessageSquare />
                    <span>Mensagem</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr><td colSpan="4" className={styles.noItems}>
                {searchTerm ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente registrado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DentistDashboard = () => {
  const { user, token } = useAuth();
  const [activeView, setActiveView] = useState('createSchedule');
  const [calendarViewMode, setCalendarViewMode] = useState('month');
  const calendar = useCalendar(token);
  const [notification, setNotification] = useState(null);
  const clearNotification = useCallback(() => setNotification(null), []);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isSubmittingObservation, setIsSubmittingObservation] = useState(false);
  const [observationError, setObservationError] = useState(null);

  useEffect(() => {
    if (token && calendar.fetchData) {
      calendar.fetchData();
    }
  }, [token, calendar.fetchData]);

  const handleScheduleCreated = () => {
    setActiveView('mySchedules');
    if (calendar.fetchData) {
      calendar.fetchData();
    }
  };
  
  const handleDayClick = useCallback((date) => {
    if (calendar.setCurrentDate) {
      calendar.setCurrentDate(date);
    }
    setCalendarViewMode('day');
  }, [calendar]);

  const handleAppointmentClick = useCallback((appointment) => {
    if (appointment.status === 'cancelado') return;
    setSelectedAppointment(appointment);
    setIsObservationModalOpen(true);
    clearNotification();
    setObservationError(null);
  }, [clearNotification]);

  const handleCloseObservationModal = useCallback(() => {
    if (isSubmittingObservation) return;
    setSelectedAppointment(null);
    setIsObservationModalOpen(false);
  }, [isSubmittingObservation]);

  const handleObservationSubmit = useCallback(async (observationData, file) => {
    if (!selectedAppointment?.id || !token) return;
    
    setIsSubmittingObservation(true);
    setObservationError(null);
    try {
      await createObservation(selectedAppointment.id, observationData, file, token);
      setNotification({ type: 'success', message: 'Prontuário salvo com sucesso!' });
      handleCloseObservationModal();
      if (calendar.fetchData) calendar.fetchData();
    } catch (err) {
      const friendlyError = translateErrorMessage(err.message, 'Falha ao salvar o prontuário.');
      setObservationError(friendlyError);
    } finally {
      setIsSubmittingObservation(false);
    }
  }, [selectedAppointment, token, handleCloseObservationModal, calendar.fetchData]);


  const MySchedulesView = () => {
    const { isLoading, error, currentDate, changeMonth, changeWeek, changeDay, goToToday } = calendar;

    useEffect(() => {
      if (error && !notification) {
        setNotification({ type: 'error', message: translateErrorMessage(error, "Erro ao carregar agenda.") });
      }
    }, [error]);

    if (isLoading) return <p>Carregando agenda...</p>;

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const headerDate = currentDate || new Date();
    const headerText = {
      month: `${monthNames[headerDate.getMonth()]} ${headerDate.getFullYear()}`,
      week: `Semana de ${headerDate.toLocaleDateString('pt-BR')}`,
      day: headerDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };
    const navLabel = calendarViewMode === 'month' ? 'mês' : (calendarViewMode === 'week' ? 'semana' : 'dia');

    return (
      <div>
        <div className={styles.calendarHeader}>
          <div className={styles.headerNav}>
            <button onClick={() => calendarViewMode === 'month' ? changeMonth(-1) : calendarViewMode === 'week' ? changeWeek(-1) : changeDay(-1)} aria-label={`Ver ${navLabel} anterior`}>&lt;</button>
            <button onClick={() => { goToToday(); setCalendarViewMode('day'); }}>Ir para Hoje</button>
            <button onClick={() => calendarViewMode === 'month' ? changeMonth(1) : calendarViewMode === 'week' ? changeWeek(1) : changeDay(1)} aria-label={`Ver próximo ${navLabel}`}>&gt;</button>
            <h2 id="content-title">{headerText[calendarViewMode]}</h2>
          </div>
          <div className={styles.viewModeButtons} role="tablist">
            <button role="tab" aria-selected={calendarViewMode === 'month'} onClick={() => setCalendarViewMode('month')} className={calendarViewMode === 'month' ? styles.active : ''}>Mês</button>
            <button role="tab" aria-selected={calendarViewMode === 'week'} onClick={() => setCalendarViewMode('week')} className={calendarViewMode === 'week' ? styles.active : ''}>Semana</button>
            <button role="tab" aria-selected={calendarViewMode === 'day'} onClick={() => setCalendarViewMode('day')} className={calendarViewMode === 'day' ? styles.active : ''}>Agenda</button>
          </div>
        </div>
        {calendarViewMode === 'month' && <MonthView calendar={calendar} onDayClick={handleDayClick} onAppointmentClick={handleAppointmentClick} />}
        {calendarViewMode === 'week' && <WeekView calendar={calendar} onDayClick={handleDayClick} onAppointmentClick={handleAppointmentClick} />}
        {calendarViewMode === 'day' && <AgendaView calendar={calendar} onAppointmentClick={handleAppointmentClick} />}
      </div>
    )
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sideMenu}>
        <div className={styles.welcomeMessage}>
          <p>Bem-vindo(a),</p>
          <strong>Dr(a). {user?.username}</strong>
        </div>
        <nav className={styles.nav} aria-label="Menu principal do dentista">
          <button
            className={`${styles.menuButton} ${activeView === 'mySchedules' ? styles.active : ''}`}
            onClick={() => setActiveView('mySchedules')}
            aria-current={activeView === 'mySchedules' ? 'page' : undefined}
          >
            Minhas Agendas
          </button>
          <button
            className={`${styles.menuButton} ${activeView === 'createSchedule' ? styles.active : ''}`}
            onClick={() => setActiveView('createSchedule')}
            aria-current={activeView === 'createSchedule' ? 'page' : undefined}
          >
            Criar Agenda
          </button>
          <button
            className={`${styles.menuButton} ${activeView === 'myPatients' ? styles.active : ''}`}
            onClick={() => setActiveView('myPatients')}
            aria-current={activeView === 'myPatients' ? 'page' : undefined}
          >
            Meus Pacientes
          </button>
        </nav>
      </aside>
      <main className={styles.contentArea} aria-labelledby="content-title">
        <Notification notification={notification} onClose={clearNotification} />
        
        {activeView === 'mySchedules' && <MySchedulesView />}
        {activeView === 'myPatients' && <PatientListView rawAppointments={calendar.rawAppointments} />}
        {activeView === 'createSchedule' && (
          calendar.isLoading ? (
            <p>Carregando dados de agenda...</p>
          ) : (
            <CreateScheduleView
              onScheduleCreated={handleScheduleCreated}
              token={token}
              existingSchedules={calendar?.schedules || []}
              setNotification={setNotification}
            />
          )
        )}
      </main>

      {isObservationModalOpen && selectedAppointment && (
        <ObservationForm
          appointment={selectedAppointment}
          onClose={handleCloseObservationModal}
          onSubmit={handleObservationSubmit}
          isLoading={isSubmittingObservation}
          serverError={observationError}
        />
      )}
    </div>
  );
};

export default DentistDashboard;