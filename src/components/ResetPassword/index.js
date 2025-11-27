import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resetPassword } from "../../services/authService";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
        setError("As senhas não conferem.");
        setIsLoading(false);
        return;
    }

    try {
      await resetPassword(token, newPassword);
      setMessage("Senha alterada com sucesso! Redirecionando...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Nova Senha</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.passwordWrapper}>
            <label htmlFor="new-password" className={styles.label}>
              Nova Senha
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className={`${styles.input} ${styles.passwordInput}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div 
                className={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                tabIndex={0}
              >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
              </div>
            </div>
          </div>

           <div className={styles.passwordWrapper}>
            <label htmlFor="confirm-password" className={styles.label}>
              Confirmar Senha
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
                className={`${styles.input} ${styles.passwordInput}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error} role="alert">{error}</div>}
          
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;