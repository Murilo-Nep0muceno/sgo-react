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
  cro: { label: "CRO", type: "text" },
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
    try {
      const result = await apiService(formData, token);

      let successMessage = '';
      if (result.message && typeof result.message === 'object' && result.message.message) {
        successMessage = result.message.message;
      }
      else if (result.message) {
        successMessage = result.message;
      }

      setMessage(successMessage);
      
      e.target.reset();
      setFormData({});
      
      if (onUserCreated) {
        onUserCreated();
      }
      
    } catch (err) {
      setError(translateErrorMessage(err.message));
    }
  };

  return (
    <>
      <h3 className={styles.title}>Cadastrar Novo {userType}</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        {requiredFields.map(field => {
          const config = fieldConfig[field] || { label: field.charAt(0).toUpperCase() + field.slice(1), type: "text" };

          if (config.type === 'password') {
            return (
              <div key={field} className={styles.formGroup}>
                <label htmlFor={field} className={styles.label}>{config.label}</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id={field}
                    name={field}
                    onChange={handleChange}
                    className={`${styles.input} ${styles.passwordInput}`}
                    required
                    autoComplete="new-password"
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
                placeholder={config.placeholder || ''}
                onChange={handleChange}
                className={styles.input}
                required
                autoComplete={field === 'email' ? 'email' : (field === 'telephone' ? 'tel' : 'off')}
              />
            </div>
          );
        })}
        <button type="submit" className={styles.button}>Cadastrar</button>
      </form>
      <FeedbackMessage type="success" message={message} />
      <FeedbackMessage type="error" message={error} />
    </>
  );
};

export default CreateUserForm;