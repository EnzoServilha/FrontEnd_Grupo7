import styles from "./ClienteInicial.module.css";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import ContatoToolbar from "../components/ContatoToolbar";

function Contatos() {
  const [tipoContato, setTipoContato] = useState("clientes");
  const [busca, setBusca] = useState("");
  const [contatos, setContatos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function carregarContatos() {
      setCarregando(true);
      try {
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

  const handleAdicionar = () => {
    console.log("Navegar para adicionar contato");
  };

  const contatosFiltrados = contatos.filter((item) =>
    item.empresa.toLowerCase().includes(busca.toLowerCase()) ||
    item.contato.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={tipoContato === "fornecedores" ? styles.tabActive : styles.tab}
            onClick={() => setTipoContato("fornecedores")}
          >
            Fornecedores
          </button>
          <button
            type="button"
            className={tipoContato === "clientes" ? styles.tabActive : styles.tab}
            onClick={() => setTipoContato("clientes")}
          >
            Clientes
          </button>
        </div>

        <div className={styles.actionCard}>
          <ContatoToolbar
            busca={busca}
            onBuscaChange={setBusca}
            onAdicionar={handleAdicionar}
            onEditar={() => console.log("Editar")}
            onDeletar={() => console.log("Deletar")}
          />
        </div>

        {carregando ? (
          <p className={styles.loadingText}>Carregando contatos...</p>
        ) : (
          <div className={styles.cardsGrid}>
            {contatosFiltrados.map((item) => (
              <article key={item.id} className={styles.contactCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.contactInfo}>
                    <h3 className={styles.empresaTitle}>{item.empresa}</h3>
                    <p className={styles.contatoSubtitle}>{item.contato}</p>
                  </div>
                  <input type="checkbox" className={styles.checkbox} aria-label="Selecionar contato" />
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.infoLine}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 4.18 2 2 0 0 1 5.08 2h3a2 2 0 0 1 2 1.72l.4 2.12a2 2 0 0 1-.53 1.84L8.5 9.5a16 16 0 0 0 6 6l1.82-1.45a2 2 0 0 1 1.84-.53l2.12.4A2 2 0 0 1 22 16.92Z" />
                    </svg>
                    <span>{item.telefone}</span>
                  </p>
                  <p className={styles.infoLine}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                    <span>{item.email}</span>
                  </p>
                  <p className={styles.infoLine}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s6-5.69 6-11a6 6 0 1 0-12 0c0 5.31 6 11 6 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <span>{item.local}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Contatos;