import { useHelp } from "./useHelp";
import styles from "./HelpPopup.module.css";

export default function HelpButton() {
  const { isOpen, openHelp } = useHelp();

  return (
    <button
      type="button"
      className={styles.helpButton}
      onClick={openHelp}
      aria-label="Abrir ajuda desta tela"
      aria-expanded={isOpen}
      title="Ajuda desta tela — F1"
    >
      <span aria-hidden="true">?</span>
      {/* <span>Ajuda (F1)</span> */}
    </button>
  );
}