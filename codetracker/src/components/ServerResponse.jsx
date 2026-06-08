import PropTypes from "prop-types";
import styles from "./ServerResponse.module.css";

function ServerResponse({ type, title, message, onRetry }) {
  // Define o ícone e a classe de estilo com base no tipo de resposta
  const getStatusConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "✓",
          statusClass: styles.success,
        };
      case "error":
        return {
          icon: "✕",
          statusClass: styles.error,
        };
      case "loading":
      default:
        return {
          icon: "",
          statusClass: styles.loading,
        };
    }
  };

  const { icon, statusClass } = getStatusConfig();

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.card} ${statusClass}`}>
        {type === "loading" ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <div className={styles.iconBadge}>{icon}</div>
        )}

        <h2 className={styles.title}>
          {title || (type === "loading" ? "Processando..." : "")}
        </h2>

        {message && <p className={styles.message}>{message}</p>}

        {type === "error" && onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
}

ServerResponse.propTypes = {
  type: PropTypes.oneOf(["success", "error", "loading"]).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

export default ServerResponse;
