import styles from "./Kpi.module.css";

function Kpi(props) {
  return (
    <div className={styles["kpi-container"]}>
      <div className={styles["kpi-title"]}>{props.title}</div>
      <div className={styles["kpi-value"]}>{props.value}</div>
    </div>
  );
}

export default Kpi;
