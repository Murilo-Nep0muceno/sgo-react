// src/components/DentistDashboard/index.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createSchedule, getMySchedules, getDoctorAppointments } from '../../services/adminService';
import styles from './DentistDashboard.module.css';

// ========================================================================
// 1. HOOK CUSTOMIZADO (COM A LÓGICA DE DATA CORRIGIDA)
// ========================================================================
const useCalendar = (token) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rawSchedules, setRawSchedules] = useState([]);
    const [rawAppointments, setRawAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!token) return;
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

    // ✅ CORREÇÃO: Mantemos a data original como string (ex: '2025-10-17') para comparações
    // e criamos um 'dateObj' separado para manipulação e ordenação.
    const schedules = useMemo(() =>
        rawSchedules.map(schedule => ({
            ...schedule,
            dateObj: new Date(`${schedule.dayOfWeek}T00:00:00`)
        })).sort((a, b) => a.dateObj - b.dateObj),
        [rawSchedules]
    );

    const appointments = useMemo(() =>
        rawAppointments.map(appointment => ({
            ...appointment,
            dateObj: new Date(`${appointment.date}T00:00:00`)
        })).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [rawAppointments]);

    const changeMonth = (amount) => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + amount); return d; });
    const changeWeek = (amount) => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + (7 * amount)); return d; });
    const changeDay = (amount) => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + amount); return d; });

    return { currentDate, setCurrentDate, schedules, appointments, fetchData, changeMonth, changeWeek, changeDay, error, isLoading };
};

// ========================================================================
// 2. COMPONENTES DE VISUALIZAÇÃO (USANDO A COMPARAÇÃO CORRETA)
// ========================================================================

const MonthView = ({ calendar, onDayClick }) => {
    const monthGrid = useMemo(() => {
        const year = calendar.currentDate.getFullYear();
        const month = calendar.currentDate.getMonth();
        const grid = [];
        let day = new Date(year, month, 1);
        day.setDate(day.getDate() - day.getDay());
        for (let i = 0; i < 42; i++) {
            const dateStr = day.toISOString().split('T')[0];
            grid.push({
                date: new Date(day),
                // ✅ CORREÇÃO: Agora comparamos string com string (a.date com dateStr), que funciona corretamente.
                appointments: calendar.appointments.filter(a => a.date === dateStr),
                schedules: calendar.schedules.filter(s => s.dayOfWeek === dateStr),
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
                        <div key={`a-${a.id}`} className={styles.appointmentItemMonth} title={`Paciente: ${a.patient?.username}\nDescrição: ${a.descricao || 'Consulta de rotina'}`}>
                            {a.patient?.username || 'Paciente'}
                        </div>
                    )}
                    {/* Mostra "Disponível" apenas se houver agenda e NENHUMA consulta marcada */}
                    {day.schedules.length > 0 && day.appointments.length === 0 &&
                        <div className={styles.scheduleItem}>Disponível</div>
                    }
                </div>
            ))}
        </div>
    );
};

const WeekView = ({ calendar, onDayClick }) => {
    const weekGrid = useMemo(() => {
        const startOfWeek = new Date(calendar.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const grid = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];
            grid.push({
                date: day,
                // ✅ CORREÇÃO: Compara string com string aqui também.
                schedules: calendar.schedules.filter(s => s.dayOfWeek === dateStr),
                appointments: calendar.appointments.filter(a => a.date === dateStr)
            });
        }
        return grid;
    }, [calendar.currentDate, calendar.schedules, calendar.appointments]);

    return (
        <div className={`${styles.calendarGrid} ${styles.weekView}`}>
            {weekGrid.map((day, i) => (
                <div key={i} className={styles.dayColumn}>
                    <div className={styles.gridHeader} onClick={() => onDayClick(day.date)}>
                        {day.date.toLocaleDateString('pt-BR', { weekday: 'short' })} {day.date.getDate()}
                    </div>
                    <div className={styles.dayContent}>
                        {day.appointments.map(a =>
                            <div key={`a-${a.id}`} className={styles.appointmentItem}>
                                <p className={styles.appointmentTime}>{a.startTime.slice(0, 5)} - {a.endTime.slice(0, 5)}</p>
                                <p className={styles.patientName}>{a.patient?.username || 'Paciente'}</p>
                            </div>
                        )}
                        {day.schedules.length > 0 && day.appointments.length === 0 && 
                            <div className={styles.scheduleItem}>{day.schedules[0].startTime.slice(0,5)} - {day.schedules[0].endTime.slice(0,5)}</div>
                        }
                         {day.schedules.length === 0 && day.appointments.length === 0 && <p className={styles.noItems}>Sem agenda</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

const AgendaView = ({ calendar }) => {
    const appointmentsForDay = useMemo(() => {
        // ✅ CORREÇÃO: Compara string com string.
        const dateStr = calendar.currentDate.toISOString().split('T')[0];
        return calendar.appointments.filter(a => a.date === dateStr);
    }, [calendar.currentDate, calendar.appointments]);

    return (
        <div className={styles.agendaContainer}>
            {appointmentsForDay.length > 0 ? (
                appointmentsForDay.map(a => (
                     <div key={a.id} className={styles.appointmentCard}>
                        <div className={styles.timeInfo}>
                            <span>{a.startTime.slice(0, 5)}</span>
                            <span>{a.endTime.slice(0, 5)}</span>
                        </div>
                        <div className={styles.details}>
                            <h4>{a.patient?.username || 'Paciente'}</h4>
                            <p>{a.descricao || 'Consulta de rotina'}</p>
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
// 3. COMPONENTE PARA CRIAÇÃO DE NOVOS HORÁRIOS (Sem alterações)
// ========================================================================
const CreateScheduleView = ({ onScheduleCreated, token, existingSchedules }) => {
    const [mode, setMode] = useState('day');
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [genericStartTime, setGenericStartTime] = useState('08:00');
    const [genericEndTime, setGenericEndTime] = useState('17:00');
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
        existingSchedules.map(s => s.dayOfWeek)
    ), [existingSchedules]);

    const handleWeekdayChange = (day, field, value) => {
        setWeekdays(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback({ type: '', text: '' });
        let payloads = [];
        let errors = [];

        try {
            if (mode === 'day') {
                if (existingScheduleDates.has(singleDate)) errors.push(`Já existe uma agenda para ${new Date(singleDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
                else if (genericStartTime >= genericEndTime) errors.push('A hora de início deve ser anterior à hora de término.');
                else payloads.push({ dayOfWeek: singleDate, startTime: genericStartTime, endTime: genericEndTime });
            } else if (mode === 'week') {
                if (!selectedWeek) errors.push('Por favor, selecione uma semana.');
                else {
                    const year = parseInt(selectedWeek.substring(0, 4));
                    const weekNo = parseInt(selectedWeek.substring(6));
                    const firstDayOfWeek = new Date(year, 0, 1 + (weekNo - 1) * 7);
                    for (const dayIndex in weekdays) {
                        const dayConfig = weekdays[dayIndex];
                        if (dayConfig.enabled) {
                            const targetDate = new Date(firstDayOfWeek);
                            targetDate.setDate(targetDate.getDate() - targetDate.getDay() + parseInt(dayIndex));
                            const dateStr = targetDate.toISOString().split('T')[0];
                            if (existingScheduleDates.has(dateStr)) errors.push(`Conflito: Já existe agenda para ${dayConfig.name} (${targetDate.toLocaleDateString('pt-BR')}).`);
                            else if (dayConfig.startTime >= dayConfig.endTime) errors.push(`Erro em ${dayConfig.name}: A hora de início deve ser anterior à hora de término.`);
                            else payloads.push({ dayOfWeek: dateStr, startTime: dayConfig.startTime, endTime: dayConfig.endTime });
                        }
                    }
                }
            } else if (mode === 'month') {
                if (!selectedMonth) errors.push('Por favor, selecione um mês.');
                else if (genericStartTime >= genericEndTime) errors.push('A hora de início deve ser anterior à hora de término.');
                else {
                    const [year, month] = selectedMonth.split('-');
                    const date = new Date(year, month - 1, 1);
                    while (date.getMonth() === month - 1) {
                        const dayOfWeek = date.getDay();
                        if (dayOfWeek > 0 && dayOfWeek < 6) {
                            const dateStr = date.toISOString().split('T')[0];
                             if (!existingScheduleDates.has(dateStr)) {
                                payloads.push({ dayOfWeek: dateStr, startTime: genericStartTime, endTime: genericEndTime });
                            }
                        }
                        date.setDate(date.getDate() + 1);
                    }
                    if(payloads.length === 0) errors.push('Todos os dias úteis deste mês já possuem agenda.');
                }
            }

            if (errors.length > 0) throw new Error(errors.join('\n'));
            if (payloads.length === 0) throw new Error('Nenhuma nova agenda para criar. Verifique os dias selecionados e possíveis conflitos.');

            await Promise.all(payloads.map(payload => createSchedule(payload, token)));
            setFeedback({ type: 'success', text: `${payloads.length} agenda(s) criada(s) com sucesso! Redirecionando...` });
            setTimeout(() => onScheduleCreated && onScheduleCreated(), 2000);
        } catch (err) {
            setFeedback({ type: 'error', text: err.message || 'Ocorreu um erro.' });
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormContent = () => {
        switch (mode) {
            case 'week': return ( <> <label className={styles.label}>Selecione a semana:</label> <input type="week" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className={styles.input} required /> <div className={styles.weekdaysContainer}> {Object.entries(weekdays).map(([dayIndex, config]) => ( <div key={dayIndex} className={`${styles.weekdayRow} ${config.enabled ? styles.enabled : ''}`}> <input type="checkbox" id={`day-${dayIndex}`} checked={config.enabled} onChange={e => handleWeekdayChange(dayIndex, 'enabled', e.target.checked)} /> <label htmlFor={`day-${dayIndex}`}>{config.name}</label> <input type="time" value={config.startTime} onChange={e => handleWeekdayChange(dayIndex, 'startTime', e.target.value)} disabled={!config.enabled} /> <span>-</span> <input type="time" value={config.endTime} onChange={e => handleWeekdayChange(dayIndex, 'endTime', e.target.value)} disabled={!config.enabled} /> </div> ))} </div> </> );
            case 'month': return ( <> <p className={styles.infoText}>Esta opção criará uma agenda para todos os dias úteis (Seg-Sex) do mês selecionado que ainda não possuam agenda.</p> <label className={styles.label}>Selecione o mês:</label> <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={styles.input} required /> <label className={styles.label}>Horário de Início Padrão:</label> <input type="time" value={genericStartTime} onChange={e => setGenericStartTime(e.target.value)} className={styles.input} required /> <label className={styles.label}>Horário de Fim Padrão:</label> <input type="time" value={genericEndTime} onChange={e => setGenericEndTime(e.target.value)} className={styles.input} required /> </> );
            default: return ( <> <label className={styles.label}>Selecione a data:</label> <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className={styles.input} required /> <label className={styles.label}>Horário de Início:</label> <input type="time" value={genericStartTime} onChange={e => setGenericStartTime(e.target.value)} className={styles.input} required /> <label className={styles.label}>Horário de Fim:</label> <input type="time" value={genericEndTime} onChange={e => setGenericEndTime(e.target.value)} className={styles.input} required /> </> );
        }
    };

    return ( <div> <h3>Criar Nova Agenda</h3> <div className={styles.tabsContainer}> <button onClick={() => setMode('day')} className={mode === 'day' ? styles.activeTab : ''}>Um Dia</button> <button onClick={() => setMode('week')} className={mode === 'week' ? styles.activeTab : ''}>Semana</button> <button onClick={() => setMode('month')} className={mode === 'month' ? styles.activeTab : ''}>Mês Inteiro</button> </div> <form onSubmit={handleSubmit} className={styles.form}> {renderFormContent()} <button type="submit" className={styles.button} disabled={isLoading}> {isLoading ? 'Criando...' : 'Criar Agenda(s)'} </button> </form> {feedback.text && <p className={styles[feedback.type]} style={{ whiteSpace: 'pre-wrap' }}>{feedback.text}</p>} </div> );
};

// ========================================================================
// 4. COMPONENTE PRINCIPAL (ORQUESTRADOR)
// ========================================================================
const DentistDashboard = () => {
    const { user, token } = useAuth();
    const [activeView, setActiveView] = useState('mySchedules');
    const [calendarViewMode, setCalendarViewMode] = useState('month');
    const calendar = useCalendar(token);

    useEffect(() => {
        if (activeView === 'mySchedules') {
            calendar.fetchData();
        }
    }, [token, activeView]);

    const handleScheduleCreated = () => {
        setActiveView('mySchedules');
    };
    
    const handleDayClick = (date) => {
        calendar.setCurrentDate(date);
        setCalendarViewMode('day');
    };

    const MySchedulesView = () => {
        if (calendar.isLoading) return <p>Carregando agenda...</p>;
        if (calendar.error) return <p className={styles.error}>{calendar.error}</p>;

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const headerText = {
            month: `${monthNames[calendar.currentDate.getMonth()]} ${calendar.currentDate.getFullYear()}`,
            week: `Semana de ${calendar.currentDate.toLocaleDateString('pt-BR')}`,
            day: calendar.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };

        return (
             <div>
                <div className={styles.calendarHeader}>
                    <div className={styles.headerNav}>
                        <button onClick={() => calendarViewMode === 'month' ? calendar.changeMonth(-1) : calendarViewMode === 'week' ? calendar.changeWeek(-1) : calendar.changeDay(-1)}>&lt;</button>
                        <button onClick={() => { calendar.setCurrentDate(new Date()); setCalendarViewMode('day'); }}>Hoje</button>
                        <button onClick={() => calendarViewMode === 'month' ? calendar.changeMonth(1) : calendarViewMode === 'week' ? calendar.changeWeek(1) : calendar.changeDay(1)}>&gt;</button>
                        <h2>{headerText[calendarViewMode]}</h2>
                    </div>
                    <div className={styles.viewModeButtons}>
                        <button onClick={() => setCalendarViewMode('month')} className={calendarViewMode === 'month' ? styles.active : ''}>Mês</button>
                        <button onClick={() => setCalendarViewMode('week')} className={calendarViewMode === 'week' ? styles.active : ''}>Semana</button>
                        <button onClick={() => setCalendarViewMode('day')} className={calendarViewMode === 'day' ? styles.active : ''}>Agenda</button>
                    </div>
                </div>
                {calendarViewMode === 'month' && <MonthView calendar={calendar} onDayClick={handleDayClick} />}
                {calendarViewMode === 'week' && <WeekView calendar={calendar} onDayClick={handleDayClick} />}
                {calendarViewMode === 'day' && <AgendaView calendar={calendar} />}
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
                <nav className={styles.nav}>
                    <button className={`${styles.menuButton} ${activeView === 'mySchedules' ? styles.active : ''}`} onClick={() => setActiveView('mySchedules')}> Minhas Agendas </button>
                    <button className={`${styles.menuButton} ${activeView === 'createSchedule' ? styles.active : ''}`} onClick={() => setActiveView('createSchedule')}> Criar Agenda </button>
                </nav>
            </aside>
            <main className={styles.contentArea}>
                {activeView === 'mySchedules' && <MySchedulesView />}
                {activeView === 'createSchedule' && <CreateScheduleView onScheduleCreated={handleScheduleCreated} token={token} existingSchedules={calendar.schedules} />}
            </main>
        </div>
    );
};

export default DentistDashboard;