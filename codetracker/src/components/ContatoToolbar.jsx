import styles from "./ContatoToolbar.module.css";

function ContatoToolbar({
  busca,
  onBuscaChange,
  onAdicionar,
  onEditar,
  onDeletar,
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.searchGroup}>
        <button type="button" className={styles.selectBox} aria-label="Selecionar filtro">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </button>

        <input
          type="text"
          className={styles.searchInput}
          value={busca}
          onChange={(e) => onBuscaChange?.(e.target.value)}
          placeholder="Digite para buscar..."
        />

        <button type="button" className={styles.filterBox} aria-label="Filtrar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" className={styles.addButton} onClick={onAdicionar}>
          <span className={styles.plusIcon}>+</span>
          <span>Adicionar</span>
        </button>

        <button type="button" className={styles.editButton} onClick={onEditar}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
          </svg>
          <span>Editar</span>
        </button>

        <button type="button" className={styles.deleteButton} onClick={onDeletar}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
          <span>Deletar</span>
        </button>
      </div>
    </div>
  );
}

export default ContatoToolbar;
