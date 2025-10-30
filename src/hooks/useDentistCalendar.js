// src/hooks/useDentistCalendar.js
import { useState, useCallback, useMemo } from 'react';
import { getMySchedules, getDoctorAppointments } from '../services/adminService';

export const useDentistCalendar = (token) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rawSchedules, setRawSchedules] = useState([]);
    const [rawAppointments, setRawAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!token) {
            setError("Autenticação necessária.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [scheduleList, appointmentList] = await Promise.all([
                getMySchedules(token),
                getDoctorAppointments(token)
            ]);
            setRawSchedules(scheduleList || []);
            setRawAppointments(appointmentList || []);
        } catch (err) {
            console.error("Falha ao buscar dados da agenda:", err);
            setError(err.message || "Não foi possível carregar os dados da agenda.");
            setRawSchedules([]);
            setRawAppointments([]);
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
        [rawAppointments]
    );

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