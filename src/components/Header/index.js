import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className={styles.header}>
            <Link to="/" className={styles.logo}>Záyon Odontologia</Link>
            <nav className={styles.nav}>
                {user ? (
                    <>
                        {user.role === 'admin' && (
                            <Link to="/admin-dashboard" className={styles.navLink}>
                                Painel Admin
                            </Link>
                        )}
                        {user.role === 'secretary' && (
                            <Link to="/secretary-dashboard" className={styles.navLink}>
                                Painel Secretária
                            </Link>
                        )}
                        {user.role === 'doctor' && (
                            <Link to="/dentist-dashboard" className={styles.navLink}>
                                Painel do Dentista
                            </Link>
                        )}
                        <button onClick={logout} className={styles.logoutButton}>
                            Sair
                        </button>
                    </>
                ) : (
                    <Link to="/login" className={styles.navLink}>
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
};

export default Header;