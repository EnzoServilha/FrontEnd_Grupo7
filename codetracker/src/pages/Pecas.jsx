import Header from "../components/Header";
import Table from "../components/Table";
import styles from "./Pecas.module.css";
import SearchBar from "../components/SearchBar";
import Kpi from "../components/Kpi";

function Pecas() {
  return (
    <div>
      <Header />

      <div className={styles.central}>
        <SearchBar placeholder="Pesquisar peças..." />
        <Table
          columns={[
            { name: "Nome", ordena: true, tipo: "string" },
            { name: "Data", ordena: true, tipo: "date" },
            { name: "Preço", ordena: true, tipo: "number" },
          ]}
          rows={[
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2024", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/09/2025", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2025", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2023", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2023", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2023", "0.9"],
            ["Alfreds Futterkiste", "10/10/2023", "10"],
            ["Centro comercial Moctezuma", "10/10/2023", "0.9"],
          ]}
        />

        <Kpi title="Total de peças" value="100%" />
      </div>
    </div>
  );
}

export default Pecas;
