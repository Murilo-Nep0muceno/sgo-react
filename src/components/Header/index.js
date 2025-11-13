import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';
import styles from './Header.module.css';
import { FiMenu, FiX, FiSun, FiMoon, FiZoomIn, FiZoomOut } from 'react-icons/fi';

const Header = () => {
  const { user, logout } = useAuth();
  const { 
    isHighContrast, 
    toggleHighContrast, 
    increaseFontSize, 
    decreaseFontSize 
  } = useAccessibility();
    
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          Záyon Odontologia
        </Link>
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menu"
          aria-controls="main-nav"
          aria-expanded={isMobileMenuOpen}
        >
          <FiMenu />
        </button>
        <nav
          id="main-nav"
          className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
        >
          <button
            className={styles.mobileCloseButton}
            onClick={closeMenu}
            aria-label="Fechar menu"
          >
            <FiX />
          </button>
          
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin-dashboard" className={styles.navLink} onClick={closeMenu}>
                  Painel Admin
                </Link>
              )}
              {user.role === 'secretary' && (
                <Link to="/secretary-dashboard" className={styles.navLink} onClick={closeMenu}>
                  Painel Secretária
                </Link>
              )}
              {user.role === 'doctor' && (
                <Link to="/dentist-dashboard" className={styles.navLink} onClick={closeMenu}>
                  Painel do Dentista
                </Link>
              )}
               {user.role === 'client' && (
                <Link to="/client-dashboard" className={styles.navLink} onClick={closeMenu}>
                  Meus Agendamentos
                </Link>
              )}
            </>
          ) : (
             <Link to="/" className={styles.navLink} onClick={closeMenu}>
                Home
             </Link>
          )}

          <div className={styles.accessibilityControls}>
            <button 
              className={styles.accessibilityButton} 
              onClick={decreaseFontSize}
              aria-label="Diminuir fonte"
            >
              <FiZoomOut />
            </button>
            <button 
              className={styles.accessibilityButton} 
              onClick={increaseFontSize}
              aria-label="Aumentar fonte"
            >
              <FiZoomIn />
            </button>
            <button 
              className={styles.accessibilityButton} 
              onClick={toggleHighContrast}
              aria-label={isHighContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
            >
              {isHighContrast ? <FiSun /> : <FiMoon />}
            </button>
          </div>
          
          {user ? (
            <button onClick={handleLogout} className={styles.logoutButton}>
              Sair
            </button>
          ) : (
            <Link to="/login" className={styles.loginButton} onClick={closeMenu}>
              Login
            </Link>
          )}
        </nav>
      </header>
      <div
        className={`${styles.overlay} ${isMobileMenuOpen ? styles.active : ''}`}
        onClick={closeMenu}
        aria-hidden={!isMobileMenuOpen}
      />
    </>
  );
};

export default Header;