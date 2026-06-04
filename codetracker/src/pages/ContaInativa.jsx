import styles from "./ContaInativa.module.css";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

function ContaInativa() {
  const navigate = useNavigate();

  const redirecionarLogin = () => {
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Conta Inativa</h1>
      <p className={styles.message}>
        Sua conta está inativa. Por favor, entre em contato com algum
        administrador para ativar sua conta.
      </p>
      <Button onClick={redirecionarLogin}>Voltar</Button>
    </div>
  );
}
export default ContaInativa;
