import Header from "../components/Header";
import Table from "../components/Table";
import styles from "./Pecas.module.css";
import SearchBar from "../components/SearchBar";
import Kpi from "../components/Kpi";
import ProgressoCadastro from "../components/ProgressoCadastro";
import DeleteModal from "../components/DeleteModal";
import { useState } from "react";

function Pecas() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleDelete = () => {
    // Sua lógica de deleção na API/Estado aqui
    console.log("Item excluído!");
    // O modal fechará automaticamente após executar este código!
  };

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

        <ProgressoCadastro
          passos={[
            { label: "Passo 1", color: "#4CAF50", textColor: "#FFFFFF" },
            { label: "Passo 2", color: "#2196F3", textColor: "#FFFFFF" },
            { label: "Passo 3", color: "#FF9800", textColor: "#FFFFFF" },
          ]}
        />

        <DeleteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}

export default Pecas;
