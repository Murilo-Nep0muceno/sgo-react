// src/components/Home/index.js
import React from "react";
import styles from "./Home.module.css";
import imgImplante from "../../assets/implanteDentario.jpg"
import clareamentoDental from "../../assets/clareamentoDental.jpg"
import proxila from "../../assets/proxila.jpg"
const servicos = [
  {
    titulo: "Limpeza e Profilaxia",
    descricao: "Remoção de placa bacteriana e tártaro para manter suas gengivas e dentes saudáveis.",
    imagem: proxila
  },
  {
    titulo: "Clareamento Dental",
    descricao: "Tratamentos seguros e eficazes para um sorriso mais branco e radiante.",
    imagem: clareamentoDental
  },
  {
    titulo: "Implantes Dentários",
    descricao: "Soluções permanentes para a substituição de dentes perdidos, restaurando a função e a estética.",
    imagem: imgImplante
  },
 
];

const Home = () => {
  return (
    <main>
      <div className={styles.hero}>
        <h1 className={styles.title}>Záyon Odontologia Humanizada</h1>
        <p className={styles.description}>
          Clínica odontológica especializada em cuidar do seu sorriso com
          excelência e atendimento personalizado.
        </p>
      </div>

      <section className={styles.servicosSection}>
        <h2 className={styles.sectionTitle}>Nossos Serviços</h2>
        <div className={styles.servicosGrid}>
          {servicos.map((servico, index) => (
            <div key={index} className={styles.servicoCard}>
              <div className={styles.imageContainer}>
                {/* 👇 A CORREÇÃO ESTÁ AQUI 👇 */}
                <img 
                  src={servico.imagem} 
                  alt={servico.titulo} 
                  className={styles.servicoImagem} 
                />
              </div>
              <h3 className={styles.cardTitle}>{servico.titulo}</h3>
              <p className={styles.cardDescription}>{servico.descricao}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;