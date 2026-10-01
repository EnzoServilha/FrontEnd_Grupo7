import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Contatos.module.css";

const contatosIniciais = {
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

const camposBuscaFornecedores = [
  ["todos", "Todos os campos"],
  ["empresa", "Empresa"],
  ["contato", "Contato"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["localizacao", "Localização"],
  ["categorias", "Categorias"],
  ["fabricantes", "Fabricantes"],
];

const camposBuscaClientes = [
  ["todos", "Todos os campos"],
  ["empresa", "Empresa"],
  ["contato", "Contato"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["localizacao", "Localização"],
  ["categorias", "Categorias"],
  ["fabricantes", "Fabricantes"],
];

function Contatos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tipoAtivo, setTipoAtivo] = useState(
    location.state?.tipoAtivo || "fornecedores",
  );
  const isCliente = tipoAtivo === "clientes";
  const rotaDetalhes = isCliente ? "/verMaisCliente" : "/verMaisFornecedor";
  const novoContato = isCliente
    ? location.state?.novoCliente
    : location.state?.novoFornecedor;

  const [contatosPorTipo, setContatosPorTipo] = useState(contatosIniciais);

  const contatosAtivos = useMemo(
    () =>
      novoContato
        ? [novoContato, ...contatosPorTipo[tipoAtivo]]
        : contatosPorTipo[tipoAtivo],
    [novoContato, contatosPorTipo, tipoAtivo],
  );

  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [selecionados, setSelecionados] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const camposBuscaAtual = isCliente
    ? camposBuscaClientes
    : camposBuscaFornecedores;

  const contatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return contatosAtivos.filter((contato) => {
      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? Object.values(contato)
          : [contato[campoBusca]];

      return valores.some((valor) =>
        String(valor).toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [busca, campoBusca, contatosAtivos]);

  const abrirDetalhes = (contato) => {
    navigate(rotaDetalhes, { state: { contato } });
  };

  const excluirSelecionados = () => {
    setContatosPorTipo((dadosAtuais) => ({
      ...dadosAtuais,
      [tipoAtivo]: dadosAtuais[tipoAtivo].filter(
        (contato) => !selecionados.includes(contato.id),
      ),
    }));
    setSelecionados([]);
    setModalExcluirAberto(false);
  };

  const editarSelecionado = () => {
    const contato = contatosAtivos.find((item) => item.id === selecionados[0]);
    if (contato) abrirDetalhes(contato);
  };

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

  const rows = contatosFiltrados.map((contato) => ({
    id: contato.id,
    cells: [
      <button
        type="button"
        className={styles.tableLink}
        onClick={() => abrirDetalhes(contato)}
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
    ],
  }));

  const campoBuscaAtivo = camposBuscaAtual.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

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
            onClick={() => {
              setTipoAtivo("fornecedores");
              setSelecionados([]);
            }}
          >
            Fornecedores
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipoAtivo === "clientes"}
            className={tipoAtivo === "clientes" ? styles.activeTab : ""}
            onClick={() => {
              setTipoAtivo("clientes");
              setSelecionados([]);
            }}
          >
            Clientes
          </button>
        </div>

        <section className={styles.toolbar} aria-label="Ações dos contatos">
          <div className={styles.searchActions}>
            <div className={styles.menuContainer}>
              <button
                type="button"
                className={styles.optionsButton}
                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                aria-expanded={menuBuscaAberto}
                aria-controls="campos-busca-contatos"
                title={`Pesquisar por: ${campoBuscaAtivo}`}
                onClick={() => {
                  setMenuBuscaAberto((aberto) => !aberto);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>

              {menuBuscaAberto && (
                <div
                  id="campos-busca-contatos"
                  className={styles.popover}
                  role="menu"
                >
                  {camposBuscaAtual.map(([valor, label]) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={valor}
                      className={
                        campoBusca === valor ? styles.selectedOption : ""
                      }
                      onClick={() => {
                        setCampoBusca(valor);
                        setMenuBuscaAberto(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.searchWrapper}>
              <SearchBar
                placeholder="Buscar contatos..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar contatos"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro
                ariaLabel="Filtrar contatos"
                onClick={() => {
                  setMenuBuscaAberto(false);
                }}
              />
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              icone="adicionar"
              onClick={() =>
                navigate(isCliente ? "/cadastrarCliente" : "/cadastrarFornecedor")
              }
            >
              Adicionar Contato
            </Button>
            <Button
              icone="editar"
              estilo="editar"
              disabled={selecionados.length !== 1}
              onClick={editarSelecionado}
            >
              Editar
            </Button>
            <Button
              icone="deletar"
              estilo="deletar"
              disabled={selecionados.length === 0}
              onClick={() => {
                if (selecionados.length > 0) setModalExcluirAberto(true);
              }}
            >
              Deletar
            </Button>
          </div>
        </section>

        <section
          className={styles.tableSection}
          aria-label={isCliente ? "Clientes" : "Fornecedores"}
        >
          <Table
            key={`${tipoAtivo}-${busca}-${campoBusca}`}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            selectedRows={selecionados}
            onSelectionChange={setSelecionados}
          />
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={excluirSelecionados}
      />
    </div>
  );
}

export default Contatos;