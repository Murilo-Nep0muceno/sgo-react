import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './CreateUserForm.module.css';
import { translateErrorMessage } from '../helpers/errorTranslator';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const fieldConfig = {
    username: { label: "Nome de Usuário", type: "text" },
    password: { label: "Senha", type: "password" },
    email: { label: "Email", type: "email" },
    telephone: { label: "Telefone", type: "tel", placeholder: "11987654321" },
    cro: { label: "CRO", type: "text", required: false },
    zipCode: { label: "CEP", type: "text", placeholder: "00000-000", isAddress: true },
    street: { label: "Rua", type: "text", isAddress: true },
    number: { label: "Número", type: "text", isAddress: true },
    neighborhood: { label: "Bairro", type: "text", isAddress: true },
    state: { label: "Estado", type: "text", isAddress: true },
};

const FeedbackMessage = ({ type, message }) => {
    if (!message) return null;
    const role = type === 'error' ? 'alert' : 'status';
    return <p className={styles[type]} role={role}>{message}</p>;
};

const CreateUserForm = ({ userType, apiService, requiredFields, onUserCreated }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isClient = userType === "Paciente";
    
    const clientAddressFields = ['zipCode', 'street', 'number', 'neighborhood', 'state'];
    const allFieldsToRender = isClient ? [...requiredFields, ...clientAddressFields].filter((v, i, a) => a.indexOf(v) === i) : requiredFields;


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const allRequired = isClient ? [...requiredFields, ...clientAddressFields].filter((v, i, a) => a.indexOf(v) === i) : requiredFields;
            for (const field of allRequired) {
                if (!formData[field]) {
                    throw new Error(`O campo "${fieldConfig[field]?.label || field}" é obrigatório.`);
                }
            }

            const result = await apiService(formData, token);

            let successMessage = result.message?.message || result.message || `Sucesso ao cadastrar ${userType}`;

            setMessage(successMessage);
            
            e.target.reset();
            setFormData({});
            
            if (onUserCreated) {
                onUserCreated();
            }
            
        } catch (err) {
            setError(translateErrorMessage(err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (field) => {
        const config = fieldConfig[field] || { label: field.charAt(0).toUpperCase() + field.slice(1), type: "text" };
        const currentValue = formData[field] || '';

        if (config.type === 'password') {
            return (
                <div key={field} className={styles.formGroup}>
                    <label htmlFor={field} className={styles.label}>{config.label}</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id={field}
                            name={field}
                            value={currentValue}
                            onChange={handleChange}
                            className={`${styles.input} ${styles.passwordInput}`}
                            required
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                        {showPassword ? (
                            <FiEye 
                                className={styles.eyeIcon} 
                                onClick={toggleShowPassword} 
                                aria-label="Ocultar senha" 
                                role="button"
                            />
                        ) : (
                            <FiEyeOff 
                                className={styles.eyeIcon} 
                                onClick={toggleShowPassword} 
                                aria-label="Mostrar senha" 
                                role="button"
                            />
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={field} className={styles.formGroup}>
                <label htmlFor={field} className={styles.label}>{config.label}</label>
                <input
                    type={config.type}
                    id={field}
                    name={field}
                    value={currentValue}
                    placeholder={config.placeholder || ''}
                    onChange={handleChange}
                    className={styles.input}
                    required={config.required !== false}
                    autoComplete={field === 'email' ? 'email' : (field === 'telephone' ? 'tel' : 'off')}
                    disabled={isLoading}
                />
            </div>
        );
    }

    return (
        <>
            <h3 className={styles.title}>Cadastrar Novo {userType}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h4>Dados Pessoais e de Acesso</h4>
                {allFieldsToRender.filter(field => !fieldConfig[field]?.isAddress).map(renderField)}
                
                {isClient && (
                    <>
                        <h4 style={{ marginTop: '20px' }}>Endereço Completo</h4>
                        {allFieldsToRender.filter(field => fieldConfig[field]?.isAddress).map(renderField)}
                    </>
                )}

                <button type="submit" className={styles.button} disabled={isLoading}>
                    {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            </form>
            <FeedbackMessage type="success" message={message} />
            <FeedbackMessage type="error" message={error} />
        </>
    );
};

export default CreateUserForm;