import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.contactInfo}>
          <p>📧 contato@zayonodonto.com.br</p>
          <p>📱 (11) 98765-4321 (WhatsApp)</p>
        </div>
        <div className={styles.copyright}>
          <p>© 2025 Záyon Odontologia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;