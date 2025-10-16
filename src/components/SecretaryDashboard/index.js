// src/components/SecretaryDashboard/index.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient, getAvailableSchedules, createAppointment } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import CreateUserForm from '../CreateUserForm';
import styles from './SecretaryDashboard.module.css';

// ========================================================================
// 1. COMPONENTES DE VISUALIZAÇÃO
// ========================================================================

const ScheduleFilters = ({ doctors, onDateChange, onDoctorChange, onClearFilters }) => (
    <div className={styles.filterContainer}>
        <input type="date" onChange={(e) => onDateChange(e.target.value)} className={styles.filterInput} />
        <select onChange={(e) => onDoctorChange(e.target.value)} className={styles.filterInput}>
            <option value="">Todos os Dentistas</option>
            {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.username}</option>)}
        </select>
        <button onClick={onClearFilters} className={styles.clearButton}>Limpar</button>
    </div>
);

const SchedulesList = ({ groupedSchedules, onSelectSchedule }) => {
    const dates = Object.keys(groupedSchedules).sort();
    if (dates.length === 0) return <p>Nenhum horário encontrado para os filtros selecionados.</p>;
    return (
        <div>
            {dates.map(date => (
                <div key={date} className={styles.dateGroup}>
                    <h3>{new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <div className={styles.schedulesGrid}>
                        {groupedSchedules[date].map(schedule => (
                            <div key={schedule.id} className={styles.scheduleCard} onClick={() => onSelectSchedule(schedule)}>
                                <p><strong>Doutor(a):</strong> {schedule.doctor?.username || 'Indisponível'}</p>
                                <p><strong>Horário:</strong> {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const AppointmentForm = ({ schedule, onSubmit, onBack, isLoading }) => {
    const [error, setError] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.target);
        const appointmentData = {
            email: formData.get('email'), startTime: formData.get('startTime'), endTime: formData.get('endTime'), descricao: formData.get('descricao'), status: 'agendado',
        };
        const startAppointmentTime = new Date(`1970-01-01T${appointmentData.startTime}`);
        const endAppointmentTime = new Date(`1970-01-01T${appointmentData.endTime}`);
        const validScheduleStartTime = new Date(`1970-01-01T${schedule.startTime}`);
        const validScheduleEndTime = new Date(`1970-01-01T${schedule.endTime}`);
        if (startAppointmentTime < validScheduleStartTime || endAppointmentTime > validScheduleEndTime) {
            setError(`Horário inválido. A consulta deve ser entre ${schedule.startTime.slice(0, 5)} e ${schedule.endTime.slice(0, 5)}.`);
            return;
        }
        if (startAppointmentTime >= endAppointmentTime) {
            setError('O horário de início deve ser antes do horário de fim.');
            return;
        }
        onSubmit(appointmentData);
    };
    return (
        <div>
            <button onClick={onBack} className={styles.backButton}>&larr; Voltar para a lista</button>
            <h3>Agendar Consulta</h3>
            <div className={styles.scheduleCardInfo}>
                <p><strong>Doutor(a):</strong> {schedule.doctor?.username || 'N/A'}</p>
                <p><strong>Data:</strong> {new Date(`${schedule.dayOfWeek}T00:00:00`).toLocaleDateString('pt-BR')}</p>
                <p><strong>Atendimento:</strong> {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</p>
            </div>
            <form onSubmit={handleSubmit} className={styles.appointmentForm}>
                <label>Email do Paciente</label>
                <input name="email" type="email" placeholder="email@paciente.com" required />
                <label>Hora de Início</label>
                <input name="startTime" type="time" required />
                <label>Hora de Fim</label>
                <input name="endTime" type="time" required />
                <label>Descrição (Opcional)</label>
                <input name="descricao" type="text" placeholder="Ex: Avaliação inicial" />
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" disabled={isLoading}>{isLoading ? 'Agendando...' : 'Confirmar Agendamento'}</button>
            </form>
        </div>
    );
};

// ========================================================================
// 2. COMPONENTE PRINCIPAL (ORQUESTRADOR)
// ========================================================================
const SecretaryDashboard = () => {
    const { user, token } = useAuth();
    const [activeView, setActiveView] = useState('appointments');
    const [allSchedules, setAllSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [dateFilter, setDateFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchSchedules = useCallback(async () => {
        setIsLoading(true); setError('');
        try {
            const data = await getAvailableSchedules(token);
            setAllSchedules(data || []);
        } catch (err) {
            setError(err.message || 'Falha ao carregar horários.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    const { filteredSchedules, availableDoctors } = useMemo(() => {
        const doctorsMap = new Map();
        allSchedules.forEach(schedule => {
            if (schedule.doctor) doctorsMap.set(schedule.doctor.id, schedule.doctor);
        });
        const filtered = allSchedules.filter(schedule => {
            const dateMatch = !dateFilter || schedule.dayOfWeek === dateFilter;
            const doctorMatch = !doctorFilter || schedule.doctor?.id === doctorFilter;
            return dateMatch && doctorMatch;
        });
        return { filteredSchedules: filtered, availableDoctors: Array.from(doctorsMap.values()) };
    }, [allSchedules, dateFilter, doctorFilter]);

    const groupedSchedules = useMemo(() => {
        return filteredSchedules.reduce((acc, schedule) => {
            const date = schedule.dayOfWeek;
            if (!acc[date]) acc[date] = [];
            acc[date].push(schedule);
            return acc;
        }, {});
    }, [filteredSchedules]);

    const handleClearFilters = () => {
        setDateFilter(''); setDoctorFilter('');
        document.querySelectorAll(`.${styles.filterInput}`).forEach(input => input.value = '');
    };

    const handleAppointmentSubmit = async (appointmentData) => {
        setMessage(''); setError(''); setIsLoading(true);
        try {
            await createAppointment(selectedSchedule.id, appointmentData, token);
            setMessage('Consulta agendada com sucesso!');
            setAllSchedules(prev => prev.filter(s => s.id !== selectedSchedule.id));
            setSelectedSchedule(null);
        } catch (err) {
            if (err.message && err.message.includes("Cannot read properties of null")) {
                setError('Paciente não encontrado. Verifique o email ou cadastre o paciente antes de agendar.');
            } else {
                setError(err.message || 'Erro ao agendar a consulta.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUserCreated = () => {
        setMessage("Paciente cadastrado com sucesso!");
        setActiveView('appointments'); // Volta para a tela de agendamento
    };

    const renderContent = () => {
        if (error) return <p className={styles.error}>{error}</p>;
        if (isLoading && allSchedules.length === 0) return <p>Carregando horários...</p>;

        switch (activeView) {
            case 'registerClient':
                return <CreateUserForm userType="Paciente" apiService={createClient} requiredFields={['username', 'email', 'telephone', 'password']} onUserCreated={handleUserCreated} />;
            case 'appointments':
                if (selectedSchedule) {
                    return <AppointmentForm schedule={selectedSchedule} onSubmit={handleAppointmentSubmit} onBack={() => setSelectedSchedule(null)} isLoading={isLoading} />;
                }
                return (
                    <div>
                        <h3>Buscar Vagas Disponíveis</h3>
                        {message && <p className={styles.success}>{message}</p>}
                        <ScheduleFilters doctors={availableDoctors} onDateChange={setDateFilter} onDoctorChange={setDoctorFilter} onClearFilters={handleClearFilters} />
                        <SchedulesList groupedSchedules={groupedSchedules} onSelectSchedule={schedule => { setSelectedSchedule(schedule); setMessage(''); setError(''); }} />
                    </div>
                );
            default:
                return <h2>Selecione uma opção</h2>;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sideMenu}>
                <div className={styles.welcomeMessage}><p>Bem-vindo(a),</p><strong>{user?.username}</strong></div>
                <nav className={styles.nav}>
                    <button className={`${styles.menuButton} ${activeView === 'appointments' ? styles.active : ''}`} onClick={() => setActiveView('appointments')}>Agendar Consulta</button>
                    <button className={`${styles.menuButton} ${activeView === 'registerClient' ? styles.active : ''}`} onClick={() => setActiveView('registerClient')}>Cadastrar Paciente</button>
                </nav>
            </aside>
            <main className={styles.contentArea}>
                {renderContent()}
            </main>
        </div>
    );
};

export default SecretaryDashboard;