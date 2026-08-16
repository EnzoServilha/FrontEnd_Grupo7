import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "dashboard", label: "Dashboard", path: "/dashboard" },
    { name: "pecas", label: "Peças", path: "/pecas" },
    { name: "pedidos", label: "Pedidos", path: "/pedidos" },
    { name: "contatos", label: "Contatos", path: "/contatos" },
    { name: "periodo", label: "Período", path: "/periodo" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <header className={styles.mainHeader}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLogo}>
          Code <span>Tracker</span>
        </div>

        <nav className={styles.headerNav}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.path);
              }}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerUser}>
          <svg
            className={styles.userIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={styles.userName}>Usuário</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
