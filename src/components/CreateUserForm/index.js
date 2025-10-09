import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './CreateUserForm.module.css';

const CreateUserForm = ({ userType, apiService, requiredFields }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const result = await apiService(formData, token);

            // 👇 LÓGICA INTELIGENTE PARA LER A MENSAGEM 👇
            let successMessage = '';
            // Verifica se a resposta é aninhada (formato de Admin/Doutor)
            if (result.message && typeof result.message === 'object' && result.message.message) {
                successMessage = result.message.message;
            } 
            // Senão, assume que é a resposta simples (formato de Secretária/Cliente)
            else if (result.message) {
                successMessage = result.message;
            }

            setMessage(successMessage);
            
            e.target.reset();
            setFormData({});
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Cadastrar Novo {userType}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                {requiredFields.map(field => (
                    <input
                        key={field}
                        type={field === 'password' ? 'password' : 'text'}
                        name={field}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                ))}
                <button type="submit" className={styles.button}>Cadastrar</button>
            </form>
            {message && <p className={styles.success}>{message}</p>}
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
};

export default CreateUserForm;