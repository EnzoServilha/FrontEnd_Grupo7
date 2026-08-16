import styles from "./SearchBar.module.css";

function SearchBar(props) {
  return (
    <div class={styles["search-container"]}>
      <input
        type="text"
        class={styles["search-input"]}
        placeholder={props.placeholder || "Pesquisar..."}
      ></input>
    </div>
  );
}

export default SearchBar;
