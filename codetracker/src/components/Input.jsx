import styles from './Input.module.css';

function Input(props) {

  const posicao = props.posicaoLabel || 'cima'; 
  
  const containerClass = [styles.textInput, styles[posicao]].join(' ');

  return (
    <div className={containerClass}>
      <label className={styles.label}>{props.label}</label>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        className={styles.inputField}
      />
    </div>
  );
}

export default Input;