// src/components/DentistDashboard/index.js (V1000 - COMPLETO E CORRIGIDO)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
// [V1000] Importa TUDO que precisamos
import { 
    createSchedule, 
    getMySchedules, 
    getDoctorAppointments, 
    createObservation 
} from '../../services/adminService';
import { translateErrorMessage } from '../helpers/errorTranslator';
import styles from './DentistDashboard.module.css';

// ========================================================================
// 0. SUB-COMPONENTES DE UI (Notificação e Modal)
// ========================================================================

/**
 * [V1000] Componente de Notificação Global
 */
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

/**
 * [V1000] Modal de Formulário de Prontuário (Observation)
 */
const ObservationForm = ({ appointment, onSubmit, onClose, isLoading, serverError }) => {
    // Campos do backlog
    const [diagnostic, setDiagnostic] = useState('');
    const [procedures, setProcedures] = useState('');
    // Campos bônus
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
            if (file.size > 5 * 1024 * 1024) { // 5MB
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
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Registrar Prontuário</h3>
                    <p>Paciente: <strong>{appointment?.patient?.username || 'N/A'}</strong></p>
                    <p>Data: {new Date(`${appointment?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} ({(appointment?.startTime || '').slice(0, 5)} - {(appointment?.endTime || '').slice(0, 5)})</p>
                    <button onClick={onClose} className={styles.modalCloseButton} disabled={isLoading}>&times;</button>
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
                    {fileError && <p className={styles.errorText}>{fileError}</p>}
                    {examFile && <p className={styles.fileName}>Arquivo: {examFile.name}</p>}

                    {/* [V1000] Exibe erro vindo do servidor (ex: falha no upload) */}
                    {serverError && <p className={styles.errorText}>{serverError}</p>}

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


// ========================================================================
// 1. HOOK CUSTOMIZADO (V50.5 - Com Filtro de Status)
// ========================================================================
const useCalendar = (token) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rawSchedules, setRawSchedules] = useState([]);
    const [rawAppointments, setRawAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Inicia true

    const fetchData = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            setError("Token não fornecido.");
            return;
        }
        setIsLoading(true); // Garante que loading seja true ao buscar
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
    }, [token]); // fetchData é recriada apenas se o token mudar

    const schedules = useMemo(() =>
        rawSchedules.map(schedule => ({
            ...schedule,
            dateObj: new Date(`${schedule.dayOfWeek}T00:00:00Z`)
        })).sort((a, b) => a.dateObj - b.dateObj),
        [rawSchedules]
    );

    const appointments = useMemo(() =>
        rawAppointments
            .filter(appointment => appointment.status !== 'cancelado') // Filtro V50.5
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
        fetchData, 
        changeMonth, changeWeek, changeDay, goToToday,
        error, isLoading 
    };
};

// ========================================================================
// 2. COMPONENTES DE VISUALIZAÇÃO (Modificados para V51)
// ========================================================================

const MonthView = ({ calendar, onDayClick, onAppointmentClick }) => {
    const monthGrid = useMemo(() => {
        if (!calendar?.currentDate) return [];
        const year = calendar.currentDate.getFullYear();
        const month = calendar.currentDate.getMonth();
        const grid = [];
        let day = new Date(year, month, 1);
        day.setDate(day.getDate() - day.getDay()); // Inicia no Domingo
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

    return (
        <div className={`${styles.calendarGrid} ${styles.monthView}`}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className={styles.gridHeader}>{day}</div>)}
            {monthGrid.map((day, i) => (
                <div key={i} onClick={() => onDayClick(day.date)}
                    className={`${styles.dayCell} ${!day.isCurrentMonth ? styles.notCurrentMonth : ''} ${day.date.toDateString() === new Date().toDateString() ? styles.today : ''}`}>
                    <span>{day.date.getDate()}</span>
                    {day.appointments.map(a => 
                        <div key={`a-${a.id}`} 
                            className={`${styles.appointmentItemMonth} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
                            title={`Paciente: ${a.patient?.username}\nStatus: ${a.status}\nClique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`}
                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(a); }}
                        >
                            {a.patient?.username || 'Paciente'}
                        </div>
                    )}
                    {day.schedules.length > 0 && day.appointments.length === 0 &&
                        <div className={styles.scheduleItem}>Disponível</div>
                    }
                </div>
            ))}
        </div>
    );
};

const WeekView = ({ calendar, onDayClick, onAppointmentClick }) => {
    const weekGrid = useMemo(() => {
        // [V1000] Lógica do weekGrid implementada
        if (!calendar?.currentDate) return [];
        const grid = [];
        let day = new Date(calendar.currentDate);
        // Subtrai o dia da semana para chegar ao Domingo (dia 0)
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

    return (
        <div className={`${styles.calendarGrid} ${styles.weekView}`}>
            {weekGrid.map((day, i) => (
                <div key={i} className={styles.dayColumn}>
                    <div className={`${styles.gridHeader} ${day.isToday ? styles.today : ''}`} onClick={() => onDayClick(day.date)}>
                        {day.date.toLocaleDateString('pt-BR', { weekday: 'short' })} {day.date.getDate()}
                    </div>
                    <div className={styles.dayContent}>
                        {day.appointments.map(a =>
                            <div key={`a-${a.id}`} 
                                className={`${styles.appointmentItem} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
                                onClick={() => onAppointmentClick(a)}
                                title={`Paciente: ${a.patient?.username}\nStatus: ${a.status}\nClique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`}
                            >
                                <p className={styles.appointmentTime}>{(a.startTime || '').slice(0, 5)} - {(a.endTime || '').slice(0, 5)}</p>
                                <p className={styles.patientName}>{a.patient?.username || 'Paciente'}</p>
                            </div>
                        )}
                        {/* [V1000] Lógica de 'scheduleItem' e 'noItems' implementada */}
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

    return (
        <div className={styles.agendaContainer}>
            {appointmentsForDay.length > 0 ? (
                appointmentsForDay.map(a => (
                    <div key={a.id} 
                        className={`${styles.appointmentCard} ${styles.clickableCard} ${a.status === 'concluído' ? styles.concluido : ''}`}
                        onClick={() => onAppointmentClick(a)}
                        role="button"
                        tabIndex={0}
                        title={`Paciente: ${a.patient?.username}\nStatus: ${a.status}\nClique para ${a.status === 'concluído' ? 'ver' : 'adicionar'} prontuário.`}
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
                ))
            ) : (
                <p className={styles.infoText}>Nenhuma consulta marcada para este dia.</p>
            )}
        </div>
    );
};

// ========================================================================
// 3. COMPONENTE PARA CRIAÇÃO DE NOVOS HORÁRIOS (V1000 - Completo)
// ========================================================================
const CreateScheduleView = ({ onScheduleCreated, token, existingSchedules, setNotification }) => {
    const [mode, setMode] = useState('day');
    const [isLoading, setIsLoading] = useState(false);
    const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [genericStartTime, setGenericStartTime] = useState('08:00'); // Não utilizado no V1000 mas mantido
    const [genericEndTime, setGenericEndTime] = useState('17:00'); // Não utilizado no V1000 mas mantido
    
    // [V1000] 'weekdays' implementado
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

    // [V1000] Função auxiliar implementada
    const getDatesForMode = () => {
        const dates = [];
        if (mode === 'day') {
             if (singleDate) dates.push(singleDate);
        } else if (mode === 'week' && selectedWeek) {
            // week format: 'YYYY-W##' (ISO 8601)
            const [year, weekNum] = selectedWeek.split('-W');
            const d = new Date(year, 0, 4); // 4 de Jan é sempre semana 1
            d.setDate(d.getDate() - (d.getDay() || 7) + 1); // Vai para Segunda
            d.setDate(d.getDate() + (weekNum - 1) * 7); // Adiciona as semanas
            
            for (let i = 0; i < 7; i++) {
                dates.push(new Date(d).toISOString().split('T')[0]);
                d.setDate(d.getDate() + 1);
            }
        } else if (mode === 'month' && selectedMonth) {
            // month format: 'YYYY-MM'
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
        setNotification(null); // Limpa notificação global
        let payloads = [];
        let errors = [];

        try {
            // [V1000] Lógica de validação e criação de payloads implementada
            const datesToCreate = getDatesForMode();
            if (datesToCreate.length === 0) {
                 throw new Error("Por favor, selecione uma data, semana ou mês válido.");
            }

            for (const dateStr of datesToCreate) {
                // Trata a data como UTC para obter o dia da semana correto
                const dateObj = new Date(dateStr + 'T00:00:00Z');
                const dayOfWeek = dateObj.getUTCDay(); // 0 (Dom) - 6 (Sab)
                const dayConfig = weekdays[dayOfWeek];

                if (dayConfig?.enabled) {
                    if (existingScheduleDates.has(dateStr)) {
                        errors.push(`Agenda para ${dateStr} já existe.`);
                    } else if (dayConfig.startTime >= dayConfig.endTime) {
                         errors.push(`Horário inválido para ${dateStr} (Início deve ser antes do Fim).`);
                    } else {
                        payloads.push({
                            dayOfWeek: dateStr, // Envia a data específica
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

    // [V1000] 'renderFormContent' implementado
    const renderFormContent = () => {
        switch (mode) {
            case 'day':
                return (
                    <div className={styles.formGroup}>
                        <label htmlFor="singleDate">Data Específica:</label>
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
                        <label htmlFor="selectedWeek">Semana:</label>
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
                        <label htmlFor="selectedMonth">Mês:</label>
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

    // [V1000] JSX do return implementado
    return ( 
        <div className={styles.createScheduleContainer}> 
            <h3>Criar Nova Agenda</h3>
            <p>Configure os horários de atendimento padrão para os dias da semana e, em seguida, escolha como deseja aplicar (dia, semana ou mês).</p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.weekdaysConfig}>
                    <h4>Horários Padrão da Semana</h4>
                    {Object.entries(weekdays).map(([dayKey, config]) => (
                        <div key={dayKey} className={styles.weekdayRow}>
                            <input
                                type="checkbox"
                                id={`check-${dayKey}`}
                                checked={config.enabled}
                                onChange={(e) => handleWeekdayChange(dayKey, 'enabled', e.target.checked)}
                            />
                            <label htmlFor={`check-${dayKey}`} className={styles.weekdayLabel}>{config.name}</label>
                            <input
                                type="time"
                                value={config.startTime}
                                onChange={(e) => handleWeekdayChange(dayKey, 'startTime', e.target.value)}
                                disabled={!config.enabled}
                                className={styles.inputTime}
                            />
                            <span>às</span>
                            <input
                                type="time"
                                value={config.endTime}
                                onChange={(e) => handleWeekdayChange(dayKey, 'endTime', e.target.value)}
                                disabled={!config.enabled}
                                className={styles.inputTime}
                            />
                        </div>
                    ))}
                </div>

                <hr className={styles.divider} />

                <h4>Aplicar Horários Para</h4>
                <div className={styles.tabButtons}>
                    <button type="button" onClick={() => setMode('day')} className={`${styles.tabButton} ${mode === 'day' ? styles.active : ''}`}>Dia Específico</button>
                    <button type="button" onClick={() => setMode('week')} className={`${styles.tabButton} ${mode === 'week' ? styles.active : ''}`}>Semana Inteira</button>
                    <button type="button" onClick={() => setMode('month')} className={`${styles.tabButton} ${mode === 'month' ? styles.active : ''}`}>Mês Inteiro</button>
                </div>
                
                {renderFormContent()}

                <button type="submit" className={styles.button} disabled={isLoading}>
                    {isLoading ? 'Criando...' : `Criar Agenda(s)`}
                </button>
            </form>
        </div> 
    );
};

// ========================================================================
// 4. COMPONENTE PRINCIPAL (DentistDashboard) - V1000
// ========================================================================
const DentistDashboard = () => {
    const { user, token } = useAuth();
    
    // [V1000 - CORREÇÃO] Alterado estado inicial para 'createSchedule'
    const [activeView, setActiveView] = useState('createSchedule'); 
    
    const [calendarViewMode, setCalendarViewMode] = useState('month');
    
    // [V1000] O Hook é chamado aqui, no topo
    const calendar = useCalendar(token);

    // [V1000] Estado global de notificação para todo o painel
    const [notification, setNotification] = useState(null);
    const clearNotification = useCallback(() => setNotification(null), []);
    
    // [V1000] Estado do Modal de Prontuário
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [isSubmittingObservation, setIsSubmittingObservation] = useState(false);
    const [observationError, setObservationError] = useState(null); // Erro *dentro* do modal

    useEffect(() => {
        // [V1000] Busca dados UMA VEZ quando o token estiver pronto
        if (token && calendar.fetchData) {
            calendar.fetchData();
        }
    }, [token, calendar.fetchData]); // calendar.fetchData é estável

    const handleScheduleCreated = () => {
        // [V1000] Ao criar, recarrega os dados e volta para a agenda
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
    }, [calendar.setCurrentDate]); // calendar.setCurrentDate é estável

    // --- Handlers do Prontuário ---
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
            // [V1000] Recarrega TUDO para atualizar status da consulta
            if (calendar.fetchData) calendar.fetchData(); 
        } catch (err) {
            const friendlyError = translateErrorMessage(err.message, 'Falha ao salvar o prontuário.');
            setObservationError(friendlyError); 
        } finally {
            setIsSubmittingObservation(false);
        }
    }, [selectedAppointment, token, handleCloseObservationModal, calendar.fetchData]); // Removido clearNotification (já está no handleAppointmentClick)


    // --- Sub-componente de Renderização da View 'Minhas Agendas' ---
    const MySchedulesView = () => {
        const { isLoading, error, currentDate, changeMonth, changeWeek, changeDay, goToToday } = calendar;

        useEffect(() => {
            if (error && !notification) { // Mostra erro do hook na notificação global
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

        return (
            <div>
                <div className={styles.calendarHeader}>
                    <div className={styles.headerNav}>
                        <button onClick={() => calendarViewMode === 'month' ? changeMonth(-1) : calendarViewMode === 'week' ? changeWeek(-1) : changeDay(-1)}>&lt;</button>
                        <button onClick={() => { goToToday(); setCalendarViewMode('day'); }}>Hoje</button>
                        <button onClick={() => calendarViewMode === 'month' ? changeMonth(1) : calendarViewMode === 'week' ? changeWeek(1) : changeDay(1)}>&gt;</button>
                        <h2>{headerText[calendarViewMode]}</h2>
                    </div>
                    <div className={styles.viewModeButtons}>
                        <button onClick={() => setCalendarViewMode('month')} className={calendarViewMode === 'month' ? styles.active : ''}>Mês</button>
                        <button onClick={() => setCalendarViewMode('week')} className={calendarViewMode === 'week' ? styles.active : ''}>Semana</button>
                        <button onClick={() => setCalendarViewMode('day')} className={calendarViewMode === 'day' ? styles.active : ''}>Agenda</button>
                    </div>
                </div>
                {calendarViewMode === 'month' && <MonthView calendar={calendar} onDayClick={handleDayClick} onAppointmentClick={handleAppointmentClick} />}
                {calendarViewMode === 'week' && <WeekView calendar={calendar} onDayClick={handleDayClick} onAppointmentClick={handleAppointmentClick} />}
                {calendarViewMode === 'day' && <AgendaView calendar={calendar} onAppointmentClick={handleAppointmentClick} />}
            </div>
        )
    };

    // --- [V1000] Renderizador Principal ---
    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}>
                    <p>Bem-vindo(a),</p>
                    <strong>Dr(a). {user?.username}</strong>
                </div>
                <nav className={styles.nav}>
                    <button className={`${styles.menuButton} ${activeView === 'mySchedules' ? styles.active : ''}`} onClick={() => setActiveView('mySchedules')}> Minhas Agendas </button>
                    <button className={`${styles.menuButton} ${activeView === 'createSchedule' ? styles.active : ''}`} onClick={() => setActiveView('createSchedule')}> Criar Agenda </button>
                </nav>
            </aside>
            <main className={styles.contentArea}>
                <Notification notification={notification} onClose={clearNotification} />
                
                {/* [V1000] Lógica de renderização de View */}
                {activeView === 'mySchedules' && <MySchedulesView />}
                {activeView === 'createSchedule' && (
                    calendar.isLoading ? (
                        <p>Carregando dados de agenda...</p>
                    ) : (
                        <CreateScheduleView 
                            onScheduleCreated={handleScheduleCreated} 
                            token={token} 
                            existingSchedules={calendar?.schedules || []}
                            setNotification={setNotification} // Passa o setter global
                        />
                    )
                )}
            </main>

            {/* [V1000] Modal do Prontuário (Renderizado no topo da DOM) */}
            {isObservationModalOpen && selectedAppointment && (
                <ObservationForm
                    appointment={selectedAppointment}
                    onClose={handleCloseObservationModal}
                    onSubmit={handleObservationSubmit}
                    isLoading={isSubmittingObservation}
                    serverError={observationError} // Passa o erro local do modal
                />
            )}
        </div>
    );
};

export default DentistDashboard;