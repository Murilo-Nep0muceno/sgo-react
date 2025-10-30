import React, { useState } from "react";
// --- [ 1. IMPORTAR ÍCONES ] ---
import { FiEye, FiEyeOff } from "react-icons/fi"; // (Sem alteração aqui)
import { useAuth } from "../../hooks/useAuth";
import styles from "./Login.module.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  // --- [ 2. ESTADO DE VISIBILIDADE ] ---
  const [showPassword, setShowPassword] = useState(false); // (Sem alteração aqui)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (error) {
      setError(error.message);
    }
  };

  // --- [ 3. FUNÇÃO TOGGLE ] ---
  const toggleShowPassword = () => { // (Sem alteração aqui)
    setShowPassword(!showPassword);
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Acesso ao Sistema</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite seu usuário ou Email"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {/* --- [ 4. CONTAINER ] --- */}
          <div className={styles.passwordWrapper}> {/* (Sem alteração aqui) */}
            <input
              type={showPassword ? "text" : "password"} // (Sem alteração aqui)
              placeholder="Digite sua senha"
              className={`${styles.input} ${styles.passwordInput}`} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* --- [ 5. O ÍCONE (LÓGICA CORRIGIDA) ] --- */}
            {showPassword ? ( 
              // Se a senha ESTÁ visível (showPassword = true), mostre o olho ABERTO
              // (Clicar nele vai OCULTAR)
              <FiEye // <-- CORRIGIDO
                className={styles.eyeIcon} 
                onClick={toggleShowPassword} 
              />
            ) : (
              // Se a senha ESTÁ oculta (showPassword = false), mostre o olho CORTADO
              // (Clicar nele vai MOSTRAR)
              <FiEyeOff // <-- CORRIGIDO
                className={styles.eyeIcon} 
                onClick={toggleShowPassword} 
              />
            )}
          </div>
          
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>Entrar</button>
        </form>
      </div>
    </main>
  );
};

export default Login;