import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const loginResponse = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.error || "Falha no login");
      }

      const { token } = loginData;
      localStorage.setItem("authToken", token);

      alert("Login realizado com sucesso!");

      const newAdminData = {
        username: "admin_criado_pelo_react",
        password: "NovaSenhaSuperForte123!",
      };

      const createAdminResponse = await fetch("http://localhost:3000/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newAdminData),
      });

      const createAdminData = await createAdminResponse.json();

      if (!createAdminResponse.ok) {
        throw new Error(createAdminData.error || "Falha ao criar novo admin.");
      }
      
      alert(`Sucesso! ${createAdminData.messagem.message}`);

    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  return (
    <main style={styles.main}>
      <h2>Login no Sistema</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Usuário"
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" style={styles.loginBtn}>
          Entrar e Criar Novo Admin
        </button>
      </form>
    </main>
  );
};

const styles = {
  main: {
    padding: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "300px",
    margin: "0 auto",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
  },
  loginBtn: {
    background: "#004aad",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
  },
};

export default Login;