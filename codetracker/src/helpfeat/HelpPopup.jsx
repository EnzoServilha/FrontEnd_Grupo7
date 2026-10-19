import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Rnd } from "react-rnd";
import { useHelp } from "./useHelp";
import { getHelpContent } from "./helpContent";
import styles from "./HelpPopup.module.css";

export default function HelpPopup() {
  const { isOpen, openHelp, closeHelp } = useHelp();
  const { pathname } = useLocation();

  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const { title, text } = getHelpContent(pathname);

  // O evento existe mesmo enquanto a janela está fechada.
  // F1 abre a ajuda; Esc fecha quando ela está aberta.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "F1") {
        event.preventDefault();
        openHelp();
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeHelp();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, openHelp, closeHelp]);

  // Ao abrir, leva o foco ao botão de fechar.
  // Ao fechar, devolve o foco ao elemento anterior.
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    return () => {
      const previousElement = previousFocusRef.current;

      if (previousElement instanceof HTMLElement && previousElement.isConnected) {
        previousElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const width = Math.min(440, window.innerWidth - 32);
  const height = Math.min(380, window.innerHeight - 32);

//   function handleDialogKeyDown(event) {
//     if (event.key === "Escape") {
//       event.stopPropagation();
//       closeHelp();
//     }
//   }

  return (
    <div className={styles.popupLayer}>
      <Rnd
        default={{
          x: Math.max(16, window.innerWidth - width - 24),
          y: Math.min(90, window.innerHeight - height - 16),
          width,
          height,
        }}
        bounds="parent"
        minWidth={Math.min(280, window.innerWidth - 32)}
        minHeight={Math.min(180, window.innerHeight - 32)}
        maxWidth="100%"
        maxHeight="100%"
        dragHandleClassName={styles.dragHandle}
        cancel="button"
        className={styles.popup}
      >
        <section
          className={styles.dialog}
          role="dialog"
          aria-modal="false"
          aria-labelledby="screen-help-title"
        >
          <div className={styles.dragHandle}>
            <h2 id="screen-help-title">{title}</h2>

            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              onClick={closeHelp}
              aria-label="Fechar ajuda"
              title="Fechar ajuda — Esc"
            >
              ×
            </button>
          </div>

          <div
            className={styles.content}
            tabIndex={0}
            role="region"
            aria-label={`Explicação: ${title}`}
          >
            {text
              .trim()
              .split(/\r?\n\s*\r?\n/)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>

          <div className={styles.footer}>
            Arraste pelo título. Redimensione pelas bordas.
          </div>
        </section>
      </Rnd>
    </div>
  );
}