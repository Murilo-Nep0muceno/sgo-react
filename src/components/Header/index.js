import styles from "./Header.module.css"
import { Link } from "react-router-dom";
function Header(){
    return(
        <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.link}>A CLÍNICA</Link>
        <Link to="/" className={styles.link}>IMPLANTE E PRÓTESE</Link>
        <Link to="/" className={styles.link}>OUTRAS ESPECIALIDADES</Link>
        <Link to="/login" className={styles.loginBtn}>LOGIN</Link>
      </nav>
    </header>
    )

}

export default Header;