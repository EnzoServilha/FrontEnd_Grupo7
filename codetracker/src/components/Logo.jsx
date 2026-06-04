import styles from "./Logo.module.css";

function Logo() {
  return (
    <div>
      <h1 className={styles.title}>
        Code <span>Tracker</span>
      </h1>
    </div>
  );
}

export default Logo;
