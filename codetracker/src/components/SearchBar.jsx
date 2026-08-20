import styles from "./SearchBar.module.css";

function SearchBar(props) {
  return (
    <div
      className={styles["search-container"]}
      style={props.size ? { width: props.size } : undefined}
    >
      <input
        type="text"
        className={styles["search-input"]}
        placeholder={props.placeholder || "Pesquisar..."}
      />
    </div>
  );
}

export default SearchBar;
