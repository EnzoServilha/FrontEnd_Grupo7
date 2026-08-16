import styles from "./AssociarCodigo.module.css";
import { useState } from "react";

function AssociarCodigo() {
  const [tipoContato, setTipoContato] = useState("cliente");
  const [busca, setBusca] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [itensAssociados, setItensAssociados] = useState([
    { id: 1, codigo: "Código", contato: "Cliente/ Fornecedor" },
  ]);

  const handleAdicionar = () => {
    if (!codigoInput.trim()) return;
    setItensAssociados([
      ...itensAssociados,
      {
        id: Date.now(),
        codigo: codigoInput,
        contato: busca || "Cliente/ Fornecedor",
      },
    ]);
    setCodigoInput("");
  };

  const handleRemover = (id) => {
    setItensAssociados(itensAssociados.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header Simples */}
      <header className={styles.header}>
        <div className={styles.logo}>
          Code<span>Tracker</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Associar Código</h1>

        {/* Card Principal */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Código XXXXXXXXX</h2>

          {/* Opções de Radio: Cliente / Fornecedor */}
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="tipoContato"
                value="cliente"
                checked={tipoContato === "cliente"}
                onChange={(e) => setTipoContato(e.target.value)}
              />
              Cliente
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="tipoContato"
                value="fornecedor"
                checked={tipoContato === "fornecedor"}
                onChange={(e) => setTipoContato(e.target.value)}
              />
              Fornecedor
            </label>
          </div>

          {/* Campo de Busca Principal com Ícone */}
          <div className={styles.searchContainer}>
            <svg
              className={styles.searchIcon}
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#64748b"
            >
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-260q133 0 226.5-93.5T700-580q0-133-93.5-226.5T380-900q-133 0-226.5 93.5T60-580q0 133 93.5 226.5T380-260Z" />
            </svg>
            <input
              type="text"
              placeholder="Digite o código que deseja associar ou o cliente/fornecedor do código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Linha para Inserir Código + Botão Adicionar */}
          <div className={styles.codeRow}>
            <label className={styles.codeLabel}>Código</label>
            <input
              type="text"
              className={styles.codeInput}
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
            />
            <button className={styles.btnAdd} onClick={handleAdicionar}>
              Adicionar
            </button>
          </div>

          {/* Atalho para Contato Não Cadastrado */}
          <div className={styles.unregisteredLink}>
            <span>Contato não cadastrado?</span>
            <button className={styles.btnCadastrar}>Cadastrar</button>
          </div>

          {/* Container Scrollável com a Listagem */}
          <div className={styles.listContainer}>
            {itensAssociados.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <button
                  className={styles.btnDelete}
                  onClick={() => handleRemover(item.id)}
                  title="Remover"
                >
                  X
                </button>
                <span className={styles.itemCodigo}>{item.codigo}</span>
                <span className={styles.itemContato}>{item.contato}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Inferiores (Fora do Card) */}
        <div className={styles.bottomActions}>
          <button className={styles.btnCancel}>Cancelar</button>
          <button className={styles.btnConfirm}>Confirmar</button>
        </div>
      </main>
    </div>
  );
}

export default AssociarCodigo;
