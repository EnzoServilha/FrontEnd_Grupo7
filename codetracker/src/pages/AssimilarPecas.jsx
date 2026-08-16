import styles from "./AssimilarPecas.module.css";
import { useState } from "react";

function AssimilarPecas() {
  const [busca, setBusca] = useState("");
  const [pecasAssimilar, setPecasAssimilar] = useState([
    { id: 1, codigoInterno: "Código Interno" },
  ]);

  const handleAdicionar = () => {
    if (!busca.trim()) return;
    setPecasAssimilar([
      ...pecasAssimilar,
      { id: Date.now(), codigoInterno: busca },
    ]);
    setBusca("");
  };

  const handleRemover = (id) => {
    setPecasAssimilar(pecasAssimilar.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          Code<span>Tracker</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Assimilar Peças</h1>

        {/* Card Principal */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            Assimilar Peça de Código XXXXXXXXX
          </h2>

          <span className={styles.inputLabel}>Pesquisar por peça:</span>

          {/* Linha de Pesquisa + Botão Adicionar */}
          <div className={styles.searchRow}>
            <div className={styles.searchContainer}>
              <svg
                className={styles.searchIcon}
                xmlns="http://www.w3.org/2000/svg"
                height="18px"
                viewBox="0 -960 960 960"
                width="18px"
                fill="#64748b"
              >
                <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-260q133 0 226.5-93.5T700-580q0-133-93.5-226.5T380-900q-133 0-226.5 93.5T60-580q0 133 93.5 226.5T380-260Z" />
              </svg>
              <input
                type="text"
                placeholder="Digite a Peça a assimilar"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <button className={styles.btnAdd} onClick={handleAdicionar}>
              Adicionar
            </button>
          </div>

          {/* Container Scrollável com as Peças */}
          <div className={styles.listContainer}>
            {pecasAssimilar.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <button
                  className={styles.btnDelete}
                  onClick={() => handleRemover(item.id)}
                  title="Remover"
                >
                  X
                </button>
                <span className={styles.itemCodigo}>{item.codigoInterno}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Inferiores */}
        <div className={styles.bottomActions}>
          <button className={styles.btnCancel}>Cancelar</button>
          <button className={styles.btnConfirm}>Confirmar</button>
        </div>
      </main>
    </div>
  );
}

export default AssimilarPecas;
