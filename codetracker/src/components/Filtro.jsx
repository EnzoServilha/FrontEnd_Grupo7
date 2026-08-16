import styles from "./Filtro.module.css";

function Filtro({ onClick, ariaLabel = "Filtrar" }) {
  return (
    <button
      type="button"
      className={styles.filterButton}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    </button>
  );
}

export default Filtro;
