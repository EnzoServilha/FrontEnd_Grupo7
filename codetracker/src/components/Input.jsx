import styles from "./Input.module.css";

function Input(props) {
  const posicao = props.posicaoLabel || "cima";
  const containerClass = [styles.textInput, styles[posicao]].join(" ");

  return (
    <div className={containerClass}>
      <label className={styles.label} htmlFor={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.name}
        type={props.type || "text"}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        required={props.required}
        autoComplete={props.autoComplete}
        className={styles.inputField}
      />
    </div>
  );
}

export default Input;