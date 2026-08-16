import styles from "./DeleteModal.module.css";

export default function DeleteModal({ isOpen = true, onClose, onConfirm }) {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    if (onConfirm) {
      onConfirm(e);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>
          Deseja mesmo <strong className={styles.highlight}>excluir </strong>
          este item?
        </h2>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>

          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
