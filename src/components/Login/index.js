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
      <h2>Login no Sistema</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Usuário"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>Entrar</button>
      </form>
    </main>
  );
};

export default Login;