import React from "react";
import styles from "./Home.module.css";

import imgImplante from "../../assets/implanteDentario.jpg";
import clareamentoDental from "../../assets/clareamentoDental.jpg";
import proxila from "../../assets/proxila.jpg";
import imagemDaClinica from "../../assets/coinsultorio.jpg";

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
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Záyon Odontologia Humanizada</h1>
        <p className={styles.description}>
          Clínica odontológica especializada em cuidar do seu sorriso com
          excelência e atendimento personalizado.
        </p>
      </section>

      <section className={styles.sobreSection}>
        <div className={styles.sobreGrid}>
          
          <div className={styles.sobreTexto}>
            <h2 className={styles.sobreTitle}>
              Záyon Odontologia: atendimento especializado e com exames no local
            </h2>
            <p className={styles.sobreDescription}>
              Na Záyon Odontologia, nossa missão é oferecer um atendimento odontológico humanizado, em que cada sorriso é tratado com carinho e atenção. Contamos com uma equipe de profissionais altamente qualificados que compartilham do compromisso de cuidar da sua saúde bucal, prezando pelo seu bem-estar e autoestima.
            </p>
            <p className={styles.sobreDescription}>
              Acreditamos que cada história é única e, por isso, nosso atendimento é personalizado, no qual consideramos as suas necessidades e expectativas. Para nós, a odontologia vai além dos dentes; é sobre transformar vidas, aliviar dores e proporcionar novos sorrisos.
            </p>
            <p className={styles.sobreDescription}>
              Cuidar de você é um privilégio que assumimos com dedicação e amor.
            </p>
          </div>

          <div className={styles.sobreImagemContainer}>
            <img
              src={imagemDaClinica}
              alt="Interior da clínica Záyon Odontologia"
              className={styles.sobreImagem}
            />
          </div>

        </div>
      </section>

      <section className={styles.servicosSection}>
        <h2 className={styles.sectionTitle}>Nossos Serviços</h2>
        <div className={styles.servicosGrid}>
          {servicos.map((servico, index) => (
            <div key={index} className={styles.servicoCard}>
              <div className={styles.imageContainer}>
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