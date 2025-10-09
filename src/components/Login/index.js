import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Login.module.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
  <main className={styles.main}>
    {/* Adicionamos um container para o formulário */}
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Acesso ao Sistema</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite seu usuário ou Email" // <-- TEXTO ALTERADO
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Digite sua senha" // <-- TEXTO ALTERADO
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>Entrar</button>
      </form>
    </div>
  </main>
  );
};

export default Login;