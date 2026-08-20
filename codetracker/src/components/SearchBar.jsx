import styles from "./SearchBar.module.css";

function SearchBar(props) {
  return (
    <div className={styles["search-container"]}>
      <input
        type="text"
        className={styles["search-input"]}
        placeholder={props.placeholder || "Pesquisar..."}
      ></input>
    </div>
  );
}

export default SearchBar;
