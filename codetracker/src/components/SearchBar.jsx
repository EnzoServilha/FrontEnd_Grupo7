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
        value={props.value}
        onChange={props.onChange}
        aria-label={props.ariaLabel || props.placeholder || "Pesquisar"}
      />
    </div>
  );
}

export default SearchBar;
