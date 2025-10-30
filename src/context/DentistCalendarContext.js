// src/context/DentistCalendarContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useDentistCalendar } from '../hooks/useDentistCalendar';
import { useAuth } from '../hooks/useAuth';

const DentistCalendarContext = createContext(null);

export const DentistCalendarProvider = ({ children }) => {
    const { token } = useAuth();
    const calendarData = useDentistCalendar(token);

    // Este useEffect agora vive aqui, no Provedor.
    // Ele busca os dados UMA VEZ quando o token é carregado.
    useEffect(() => {
        if (token) {
            calendarData.fetchData();
        }
    }, [token, calendarData.fetchData]); // Depende do fetchData estável

    return (
        <DentistCalendarContext.Provider value={calendarData}>
            {children}
        </DentistCalendarContext.Provider>
    );
};

// Hook customizado para consumir o contexto
export const useDentistCalendarContext = () => {
    const context = useContext(DentistCalendarContext);
    if (!context) {
        throw new Error("useDentistCalendarContext deve ser usado dentro de um DentistCalendarProvider");
    }
    return context;
};