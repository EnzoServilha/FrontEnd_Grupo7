import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
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

function Contatos() {
  const navigate = useNavigate();
  const [tipoAtivo, setTipoAtivo] = useState("fornecedores");
  const isCliente = tipoAtivo === "clientes";
  const rotaDetalhes =
    isCliente ? "/verMaisCliente" : "/verMaisFornecedor";
  const columns = [
    { name: "Empresa", ordena: false, tipo: "string" },
    { name: "Contato", ordena: true, tipo: "string" },
    { name: "Telefone", ordena: false, tipo: "string" },
    { name: "E-mail", ordena: true, tipo: "string" },
    { name: "Localização", ordena: true, tipo: "string" },
    ...(!isCliente
      ? [
          { name: "Categorias", ordena: true, tipo: "string" },
          { name: "Fabricantes", ordena: true, tipo: "string" },
        ]
      : []),
  ];
  const rows = contatos[tipoAtivo].map((contato) => [
    <button
      type="button"
      className={styles.tableLink}
      onClick={() => navigate(rotaDetalhes)}
    >
      {contato.empresa}
    </button>,
    contato.contato,
    contato.telefone,
    contato.email,
    contato.localizacao,
    ...(!isCliente
      ? [contato.categorias.join(", "), contato.fabricantes.join(", ")]
      : []),
  ]);

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
          className={styles.tableSection}
          aria-label={isCliente ? "Clientes" : "Fornecedores"}
        >
          <Table key={tipoAtivo} columns={columns} rows={rows} />
        </section>
      </main>
    </div>
  );
}

export default Contatos;
