import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (error) {
      setError(error.message || "Falha no login. Verifique seu usuário e senha.");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Acesso ao Sistema</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          
          <div className={styles.formGroup}>
            <label htmlFor="login-username" className={styles.label}>
              Usuário ou Email
            </label>
            <input
              id="login-username"
              type="text"
              placeholder="Digite seu usuário ou Email"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.passwordWrapper}>
            <label htmlFor="login-password" className={styles.label}>
              Senha
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                className={`${styles.input} ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
          
          <div style={{ textAlign: "right", marginTop: "-10px" }}>
            <Link to="/forgot-password" style={{ fontSize: "0.9rem", color: "var(--dourado-zayon)", textDecoration: "none", fontWeight: 500 }}>
                Esqueci minha senha
            </Link>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.button}>Entrar</button>
        </form>
      </div>
    </main>
  );
};

export default Login;