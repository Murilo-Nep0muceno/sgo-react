import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        
        <div className={styles.footerInfo}>
          
          <div className={styles.infoBlock}>
            <h3 className={styles.footerTitle}>Localização</h3>
            <p>R. Diogo Cebrian, 47 - Centro, Poá - SP, 08550-160</p>
          </div>

          <div className={styles.infoBlock}>
            <h3 className={styles.footerTitle}>Contato</h3>
            <p aria-label="Email">📧 contato@zayonodonto.com.br</p>
            <p aria-label="WhatsApp">📱 (11) 98765-4321 (WhatsApp)</p>
          </div>
          
          <div className={styles.infoBlock}>
            <h3 className={styles.footerTitle}>Responsáveis Técnicos</h3>
            <div className={styles.dentistInfo}>
              <p>
                <strong>Rafael Dornelas Nepomuceno</strong><br />
                Cirurgião dentista<br />
                CROSP 85581
              </p>
              <p>
                <strong>Paula Braga C. Nepomuceno</strong><br />
                Cirurgiã dentista<br />
                CROSP 110767
              </p>
            </div>
          </div>
        </div>
        
        <div className={styles.footerMap}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3658.261266635316!2d-46.34778102377464!3d-23.52382106048101!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce7a605f6932c9%3A0xf66a3d9d300baa4b!2sR.%20Diogo%20Cebrian%2C%2047%20-%20Centro%2C%20Po%C3%A1%20-%20SP%2C%2008550-160!5e0!3m2!1spt-BR!2sbr!4v1730294314782!5m2!1spt-BR!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa da Localização da Záyon Odontologia"
          ></iframe>
        </div>
        
        <div className={styles.copyright}>
          <p>© 2025 Záyon Odontologia. Todos os direitos reservados.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;