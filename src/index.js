// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Importe o AuthProvider
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>      {/* 1. O Router vem primeiro, por fora de tudo */}
      <AuthProvider> {/* 2. O AuthProvider vem depois, por dentro */}
        <App />      {/* 3. O App fica por último */}
      </AuthProvider>
    </Router>
  </React.StrictMode>
);