// src/components/SecretaryDashboard/index.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './SecretaryDashboard.module.css';

const SecretaryDashboard = () => {
    const { user } = useAuth();

    const handlePatientSubmit = (e) => {
        e.preventDefault();
        // AQUI virá a lógica para chamar a API e criar o paciente.
        // Por enquanto, apenas exibimos um alerta.
        alert('Funcionalidade de cadastrar paciente a ser implementada no backend.');
    };

    return (
        <main className={styles.main}>
            <h2>Painel da Secretária</h2>
            <p>Bem-vindo(a), <strong>{user?.username}</strong>!</p>
            <div className={styles.formContainer}>
                <h3>Cadastrar Novo Paciente</h3>
                <form onSubmit={handlePatientSubmit} className={styles.form}>
                    <input type="text" name="name" placeholder="Nome Completo do Paciente" className={styles.input} required />
                    <input type="date" name="birthdate" className={styles.input} required />
                    <input type="text" name="phone" placeholder="Telefone" className={styles.input} />
                    <button type="submit" className={styles.button}>Cadastrar Paciente</button>
                </form>
            </div>
        </main>
    );
};

export default SecretaryDashboard;