import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Pecas.module.css";

const pecasIniciais = [
  {
    id: 1,
    codigoInterno: "CT-9482X",
    codigosAssociados: 1,
    quantidade: 1250,
    localizacao: "Galpão A - Prateleira 4",
    precoCompra: "R$ 145,20",
    precoVenda: "R$ 289,90",
    marca: "Bosch Premium",
    dataCadastro: "12/04/2026",
    anoFabricacao: "2025",
  },
  {
    id: 2,
    codigoInterno: "CT-1053Y",
    codigosAssociados: 3,
    quantidade: 420,
    localizacao: "Galpão B - Prateleira 2",
    precoCompra: "R$ 18,90",
    precoVenda: "R$ 45,00",
    marca: "Magneti Marelli",
    dataCadastro: "18/05/2026",
    anoFabricacao: "2026",
  },
];

const camposBusca = [
  ["todos", "Todos os campos"],
  ["codigoInterno", "Código interno"],
  ["localizacao", "Localização"],
  ["marca", "Marca"],
  ["anoFabricacao", "Ano de fabricação"],
];

function Pecas() {
  const navigate = useNavigate();
  const [pecas, setPecas] = useState(pecasIniciais);
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [marcaFiltrada, setMarcaFiltrada] = useState("todas");
  const [selecionadas, setSelecionadas] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const marcasDisponiveis = useMemo(
    () => ["todas", ...new Set(pecas.map((peca) => peca.marca))],
    [pecas],
  );

  const pecasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pecas.filter((peca) => {
      if (marcaFiltrada !== "todas" && peca.marca !== marcaFiltrada) {
        return false;
      }

      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? [
            peca.codigoInterno,
            peca.localizacao,
            peca.marca,
            peca.anoFabricacao,
          ]
          : [peca[campoBusca]];

      return valores.some((valor) =>
        String(valor).toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [busca, campoBusca, marcaFiltrada, pecas]);

  const abrirDetalhes = (peca) => {
    navigate("/verMaisPeca", { state: { peca } });
  };

  const excluirSelecionadas = () => {
    setPecas((itensAtuais) =>
      itensAtuais.filter((peca) => !selecionadas.includes(peca.id)),
    );
    setSelecionadas([]);
  };

  const editarSelecionada = () => {
    const peca = pecas.find((item) => item.id === selecionadas[0]);
    if (peca) abrirDetalhes(peca);
  };

  const columns = [
    { name: "Código Interno", ordena: false, tipo: "string" },
    { name: "Quantidade em Estoque", ordena: true, tipo: "number" },
    { name: "Localização", ordena: false, tipo: "string" },
    { name: "Preço Médio de Compra", ordena: true, tipo: "number" },
    { name: "Preço Médio de Venda", ordena: true, tipo: "number" },
    { name: "Marca", ordena: false, tipo: "string" },
    { name: "Data de Cadastro", ordena: true, tipo: "date" },
    { name: "Ano de Fabricação", ordena: true, tipo: "number" },
  ];

  const rows = pecasFiltradas.map((peca) => {
    const rotuloCodigos =
      peca.codigosAssociados === 1
        ? "1 Código associado vinculado"
        : `${peca.codigosAssociados} Códigos associados vinculados`;

    return {
      id: peca.id,
      cells: [
        <button
          type="button"
          className={styles.tableLink}
          onClick={() => abrirDetalhes(peca)}
        >
          <strong>{peca.codigoInterno}</strong>
          <span className={styles.associatedCodes}>{rotuloCodigos}</span>
        </button>,
        <span className={styles.stockBadge}>
          {peca.quantidade.toLocaleString("pt-BR")} unidades
        </span>,
        peca.localizacao,
        peca.precoCompra,
        peca.precoVenda,
        <span className={styles.brand}>{peca.marca}</span>,
        peca.dataCadastro,
        peca.anoFabricacao,
      ],
    };
  });

  const campoBuscaAtivo = camposBusca.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.tabs} role="tablist" aria-label="Visões de peças">
          <button
            type="button"
            role="tab"
            aria-selected="true"
            className={styles.activeTab}
          >
            Catálogo de Peças
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="false"
            aria-disabled="true"
            title="Entradas e saídas ainda não disponíveis"
          >
            Entradas e Saídas
          </button>
        </div>

        <section className={styles.toolbar} aria-label="Ações do catálogo">
          <div className={styles.searchActions}>
            <div className={styles.menuContainer}>
              <button
                type="button"
                className={styles.optionsButton}
                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                aria-expanded={menuBuscaAberto}
                aria-controls="campos-busca-pecas"
                title={`Pesquisar por: ${campoBuscaAtivo}`}
                onClick={() => {
                  setMenuBuscaAberto((aberto) => !aberto);
                  setFiltroAberto(false);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>

              {menuBuscaAberto && (
                <div
                  id="campos-busca-pecas"
                  className={styles.popover}
                  role="menu"
                >
                  {camposBusca.map(([valor, label]) => (
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
                placeholder="Digite para buscar..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar no catálogo de peças"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro
                ariaLabel="Filtrar peças por marca"
                onClick={() => {
                  setFiltroAberto((aberto) => !aberto);
                  setMenuBuscaAberto(false);
                }}
              />

              {filtroAberto && (
                <div
                  className={`${styles.popover} ${styles.filterPopover}`}
                  role="menu"
                >
                  {marcasDisponiveis.map((marca) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={marca}
                      className={
                        marcaFiltrada === marca ? styles.selectedOption : ""
                      }
                      onClick={() => {
                        setMarcaFiltrada(marca);
                        setFiltroAberto(false);
                        setSelecionadas([]);
                      }}
                    >
                      {marca === "todas" ? "Todas as marcas" : marca}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              icone="adicionar"
              onClick={() => navigate("/cadastrarPeca")}
            >
              Adicionar Peça
            </Button>
            <Button
              icone="editar"
              estilo="editar"
              disabled={selecionadas.length !== 1}
              onClick={editarSelecionada}
            >
              Editar
            </Button>
            <Button
              icone="deletar"
              estilo="deletar"
              disabled={selecionadas.length === 0}
              onClick={() => {
                if (selecionadas.length > 0) setModalExcluirAberto(true);
              }}
            >
              Deletar
            </Button>
          </div>
        </section>

        <section className={styles.tableSection} aria-label="Catálogo de peças">
          <Table
            key={`${busca}-${campoBusca}-${marcaFiltrada}`}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            selectedRows={selecionadas}
            onSelectionChange={setSelecionadas}
          />
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={excluirSelecionadas}
      />
    </div>
  );
}

export default Pecas;
