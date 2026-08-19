import styles from "./ClienteInicial.module.css";
import { useState, useEffect } from "react";

// import { api } from "../services/api";

// import Header from "../components/Header";

function Contatos() {
  // 1. ESTADOS
  const [tipoContato, setTipoContato] = useState("clientes"); // "clientes" ou "fornecedores"
  const [busca, setBusca] = useState("");
  const [contatos, setContatos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // 2. BUSCA DE DADOS NO BACKEND
  useEffect(() => {
    async function carregarContatos() {
      setCarregando(true);
      try {
        // const response = await api.get(`/contatos?tipo=${tipoContato}`);
        // setContatos(response.data);

        // Dados mocado temporários para testes visuais
        setContatos([
          { id: 1, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
          { id: 2, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
          { id: 3, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
          { id: 4, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
          { id: 5, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
          { id: 6, empresa: "Nome Da Empresa", contato: "Nome do Contato", telefone: "Telefone", email: "Email", local: "UF - Cidade" },
        ]);
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarContatos();
  }, [tipoContato]);

  // AÇÕES
  const handleAdicionar = () => {
    // IMPORTANTE: Adicione o redirecionamento para a tela de formulário se houver
    console.log("Navegar para adicionar contato");
  };

  // Filtragem da busca local
  const contatosFiltrados = contatos.filter((item) =>
    item.empresa.toLowerCase().includes(busca.toLowerCase()) ||
    item.contato.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          Code<span>Tracker</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Abas Superiores (Fornecedores / Clientes) */}
        <div className={styles.tabGroup}>
          <button
            className={tipoContato === "fornecedores" ? styles.tabActive : styles.tab}
            onClick={() => setTipoContato("fornecedores")}
          >
            Fornecedores
          </button>
          <button
            className={tipoContato === "clientes" ? styles.tabActive : styles.tab}
            onClick={() => setTipoContato("clientes")}
          >
            Clientes
          </button>
        </div>

        {/* Card de Filtros e Botões */}
        <div className={styles.actionCard}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.btnAdd} onClick={handleAdicionar}>
              + Adicionar
            </button>
            <button className={styles.btnEdit}>Editar</button>
            <button className={styles.btnDelete}>Deletar</button>
          </div>
        </div>

        {/* Grid de Cards dos Contatos */}
        {carregando ? (
          <p>Carregando contatos...</p>
        ) : (
          <div className={styles.cardsGrid}>
            {contatosFiltrados.map((item) => (
              <div key={item.id} className={styles.contactCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.empresaTitle}>{item.empresa}</h3>
                    <p className={styles.contatoSubtitle}>{item.contato}</p>
                  </div>
                  <input type="checkbox" className={styles.checkbox} />
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.infoLine}> {item.telefone}</p>
                  <p className={styles.infoLine}> {item.email}</p>
                  <p className={styles.infoLine}> {item.local}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Contatos;