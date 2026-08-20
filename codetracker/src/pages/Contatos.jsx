import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import styles from "./Contatos.module.css";

const contatos = {
  fornecedores: [
    {
      id: 1,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria A"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 2,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria B"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 3,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria C"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 4,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria A"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 5,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria B"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 6,
      empresa: "Nome da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria C"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
  ],
  clientes: [
    {
      id: 1,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria A"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 2,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria B"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 3,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria C"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 4,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria A"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 5,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria B"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
    {
      id: 6,
      empresa: "Nome Da Empresa",
      contato: "Nome do Contato",
      localizacao: "UF - Cidade",
      telefone: "(00) 00000-0000",
      email: "email@empresa.com",
      categorias: ["Categoria C"],
      fabricantes: ["Marca X", "Marca Y", "Marca Z"],
    },
  ],
};

function InfoIcon({ type }) {
  if (type === "location") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function Contatos() {
  const navigate = useNavigate();
  const [tipoAtivo, setTipoAtivo] = useState("fornecedores");
  const rotaDetalhes =
    tipoAtivo === "fornecedores"
      ? "/verMaisFornecedor"
      : "/verMaisCliente";

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.tabs} role="tablist" aria-label="Tipo de contato">
          <button
            type="button"
            role="tab"
            aria-selected={tipoAtivo === "fornecedores"}
            className={tipoAtivo === "fornecedores" ? styles.activeTab : ""}
            onClick={() => setTipoAtivo("fornecedores")}
          >
            Fornecedores
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipoAtivo === "clientes"}
            className={tipoAtivo === "clientes" ? styles.activeTab : ""}
            onClick={() => setTipoAtivo("clientes")}
          >
            Clientes
          </button>
        </div>

        <section className={styles.toolbar} aria-label="Ações dos contatos">
          <div className={styles.searchActions}>
            <button
              type="button"
              className={styles.optionsButton}
              aria-label="Opções de busca"
              title="Opções de busca"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 10 5 5 5-5" />
              </svg>
            </button>
            <div className={styles.searchWrapper}>
              <SearchBar
                placeholder="Buscar contatos..."
              />
            </div>
            <Filtro ariaLabel="Filtrar contatos" />
          </div>

          <div className={styles.actionButtons}>
            <Button icone="adicionar">
              adicionar
            </Button>
            <Button icone="editar" estilo="editar">
              Editar
            </Button>
            <Button icone="deletar" estilo="deletar">
              Deletar
            </Button>
          </div>
        </section>

        <section
          className={styles.contactGrid}
          aria-label={tipoAtivo === "fornecedores" ? "Fornecedores" : "Clientes"}
        >
          {tipoAtivo === "clientes" ? (
            contatos.clientes.map((contato) => (
              <article className={styles.clientCard} key={contato.id}>
                <div className={styles.clientSummary}>
                  <button
                    type="button"
                    className={styles.companyLink}
                    onClick={() => navigate(rotaDetalhes)}
                    aria-label={`Ver detalhes de ${contato.empresa}`}
                  >
                    {contato.empresa}
                  </button>
                  <p>{contato.contato}</p>
                </div>

                <div className={styles.clientDetails}>
                  <p>
                    <InfoIcon type="phone" />
                    Telefone
                  </p>
                  <p>
                    <InfoIcon type="email" />
                    Email
                  </p>
                  <p>
                    <InfoIcon type="location" />
                    {contato.localizacao}
                  </p>
                </div>

                <input
                  className={styles.clientCheckbox}
                  type="checkbox"
                  aria-label={`Selecionar ${contato.empresa}`}
                />
              </article>
            ))
          ) : (
            contatos.fornecedores.map((contato) => (
            <article className={styles.contactCard} key={contato.id}>
              <div className={styles.cardHeader}>
                <button
                  type="button"
                  className={styles.companyLink}
                  onClick={() => navigate(rotaDetalhes)}
                  aria-label={`Ver detalhes de ${contato.empresa}`}
                >
                  {contato.empresa}
                </button>
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${contato.empresa}`}
                />
              </div>

              <p className={styles.infoLine}>
                <InfoIcon type="location" />
                {contato.localizacao}
              </p>

              <h3>{contato.contato}</h3>
              <p className={styles.infoLine}>
                <InfoIcon type="phone" />
                {contato.telefone}
              </p>
              <p className={styles.infoLine}>
                <InfoIcon type="email" />
                {contato.email}
              </p>

              <h3>Categorias:</h3>
              <div className={styles.tags}>
                {contato.categorias.map((categoria) => (
                  <span key={categoria}>{categoria}</span>
                ))}
              </div>

              <h3>Fabricantes:</h3>
              <div className={styles.tags}>
                {contato.fabricantes.map((fabricante) => (
                  <span key={fabricante}>{fabricante}</span>
                ))}
                <span className={styles.moreTags}>...</span>
              </div>
            </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Contatos;
