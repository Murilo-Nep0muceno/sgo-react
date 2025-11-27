import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import styles from "./ForgotPassword.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage("Se o e-mail estiver cadastrado, um link de recuperação foi enviado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Recuperar Senha</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Cadastrado
            </label>
            <input
              id="email"
              type="email"
              placeholder="Digite seu email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error} role="alert">{error}</div>}

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Link"}
          </button>

          <div className={styles.textLink}>
            <Link to="/login">Voltar para o Login</Link>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ForgotPassword;