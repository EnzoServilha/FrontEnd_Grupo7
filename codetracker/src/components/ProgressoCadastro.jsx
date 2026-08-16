import styles from "./ProgressoCadastro.module.css";

function ProgressoCadastro(props) {
  const progresso = props.passos.slice(0, 3);

  return (
    <div className={styles.container}>
      <div className={styles.caixaProgresso}>
        <div className={styles.linhaFundo} />

        {progresso.map((passo, index) => {
          const passoIndex = index + 1;

          return (
            <div key={index} className={styles.stepItem}>
              <div
                className={styles.circle}
                style={{
                  backgroundColor: passo.color || "#e2e8f0",
                  color: passo.textColor || "#000000",
                }}
              >
                {passoIndex}
              </div>
              <span className={styles.label}>{passo.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressoCadastro;
