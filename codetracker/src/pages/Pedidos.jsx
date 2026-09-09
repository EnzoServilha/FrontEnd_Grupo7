import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Pedidos.module.css";

const pedidosIniciais = [
  {
    id: 1,
    tipo: "Compra",
    categoria: "compras",
    status: "Concluída",
    statusClass: "concluido",
    valorTotal: "R$ XXX.XXX",
    pagadorFrete: "XXXXXXX",
    precoFrete: "R$ XXX.XXX",
    precoImposto: "R$ XXX.XXX",
    precoProdutos: "R$ XXX.XXX",
    quantidade: "XXX",
    dataEntrega: "XX/XX/XX",
    dataPrevista: "XX/XX/XX",
    dataPedido: "XX/XX/XX",
  },
  {
    id: 2,
    tipo: "Venda",
    categoria: "vendas",
    status: "Concluída com Atraso",
    statusClass: "atrasado",
    valorTotal: "R$ XXX.XXX",
    pagadorFrete: "XXXXXXX",
    precoFrete: "R$ XXX.XXX",
    precoImposto: "R$ XXX.XXX",
    precoProdutos: "R$ XXX.XXX",
    quantidade: "XXX",
    dataEntrega: "XX/XX/XX",
    dataPrevista: "XX/XX/XX",
    dataPedido: "XX/XX/XX",
  },
  {
    id: 3,
    tipo: "Venda",
    categoria: "vendas",
    status: "Em Andamento",
    statusClass: "andamento",
    valorTotal: "R$ XXX.XXX",
    pagadorFrete: "XXXXXXX",
    precoFrete: "R$ XXX.XXX",
    precoImposto: "R$ XXX.XXX",
    precoProdutos: "R$ XXX.XXX",
    quantidade: "XXX",
    dataEntrega: "XX/XX/XX",
    dataPrevista: "XX/XX/XX",
    dataPedido: "XX/XX/XX",
  },
  {
    id: 4,
    tipo: "Compra",
    categoria: "compras",
    status: "Cancelada",
    statusClass: "cancelado",
    valorTotal: "R$ XXX.XXX",
    pagadorFrete: "XXXXXXX",
    precoFrete: "R$ XXX.XXX",
    precoImposto: "R$ XXX.XXX",
    precoProdutos: "R$ XXX.XXX",
    quantidade: "XXX",
    dataEntrega: "XX/XX/XX",
    dataPrevista: "XX/XX/XX",
    dataPedido: "XX/XX/XX",
  },
  {
    id: 5,
    tipo: "Cotação",
    categoria: "cotacoes",
    status: "Concluída Completamente",
    statusClass: "completo",
    valorTotal: "R$ XXX.XXX",
    pagadorFrete: "XXXXXXX",
    precoFrete: "R$ XXX.XXX",
    precoImposto: "R$ XXX.XXX",
    precoProdutos: "R$ XXX.XXX",
    quantidade: "XXX",
    dataEntrega: "XX/XX/XX",
    dataPrevista: "XX/XX/XX",
    dataPedido: "XX/XX/XX",
  },
];

const tabs = [
  ["todos", "Todos"],
  ["vendas", "Vendas"],
  ["compras", "Compras"],
  ["cotacoes", "Cotações"],
];

const camposBusca = [
  ["todos", "Todos os campos"],
  ["tipo", "Tipo"],
  ["status", "Status"],
  ["dataPedido", "Data do pedido"],
];

const statusDisponiveis = [
  ["todos", "Todos os status"],
  ["Concluída", "Concluídos"],
  ["Em Andamento", "Em andamento"],
  ["Cancelada", "Cancelados"],
];

function Pedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [tabAtiva, setTabAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [statusFiltrado, setStatusFiltrado] = useState("todos");
  const [selecionados, setSelecionados] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pedidos.filter((pedido) => {
      const correspondeATab =
        tabAtiva === "todos" || pedido.categoria === tabAtiva;
      const correspondeAoStatus =
        statusFiltrado === "todos" || pedido.status.includes(statusFiltrado);

      if (!correspondeATab || !correspondeAoStatus) return false;
      if (!termo) return true;

      const valores =
        campoBusca === "todos" ? Object.values(pedido) : [pedido[campoBusca]];

      return valores.some((valor) =>
        String(valor).toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [busca, campoBusca, pedidos, statusFiltrado, tabAtiva]);

  const excluirSelecionados = () => {
    setPedidos((itensAtuais) =>
      itensAtuais.filter((pedido) => !selecionados.includes(pedido.id)),
    );
    setSelecionados([]);
    setModalExcluirAberto(false);
  };

  const editarSelecionado = () => {
    const pedido = pedidos.find((item) => item.id === selecionados[0]);
    if (pedido) navigate("/verMaisPedido", { state: { pedido } });
  };

  const gerarEtiquetaSelecionados = () => {
    if (selecionados.length === 0) return;
    // TODO: integrar geração de etiqueta para os pedidos selecionados
  };

  const alterarStatusSelecionados = (event) => {
    const novoStatus = event.target.value;
    if (!novoStatus || selecionados.length === 0) return;

    setPedidos((itensAtuais) =>
      itensAtuais.map((pedido) =>
        selecionados.includes(pedido.id)
          ? { ...pedido, status: novoStatus }
          : pedido,
      ),
    );
    event.target.value = "";
  };

  const columns = [
    { name: "Tipo", ordena: false, tipo: "string" },
    { name: "Status", ordena: false, tipo: "string" },
    { name: "Valor Total", ordena: true, tipo: "number" },
    { name: "Pagador do Frete", ordena: false, tipo: "string" },
    { name: "Preço do Frete", ordena: true, tipo: "number" },
    { name: "Preço do Imposto", ordena: true, tipo: "number" },
    { name: "Preço dos Produtos", ordena: true, tipo: "number" },
    { name: "Qtd. Itens", ordena: true, tipo: "number" },
    { name: "Data da Entrega", ordena: true, tipo: "date" },
    { name: "Data Prevista", ordena: true, tipo: "date" },
    { name: "Data do Pedido", ordena: true, tipo: "date" },
  ];

  const rows = pedidosFiltrados.map((pedido) => ({
    id: pedido.id,
    cells: [
      <button
        type="button"
        className={styles.tableLink}
        onClick={() => navigate("/verMaisPedido", { state: { pedido } })}
      >
        {pedido.tipo}
      </button>,
      <span className={`${styles.statusBadge} ${styles[pedido.statusClass]}`}>
        {pedido.status}
      </span>,
      pedido.valorTotal,
      pedido.pagadorFrete,
      pedido.precoFrete,
      pedido.precoImposto,
      pedido.precoProdutos,
      pedido.quantidade,
      pedido.dataEntrega,
      pedido.dataPrevista,
      pedido.dataPedido,
    ],
  }));

  const campoBuscaAtivo = camposBusca.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.tabs} role="tablist" aria-label="Tipos de pedido">
          {tabs.map(([valor, label]) => (
            <button
              type="button"
              role="tab"
              key={valor}
              aria-selected={tabAtiva === valor}
              className={tabAtiva === valor ? styles.activeTab : ""}
              onClick={() => {
                setTabAtiva(valor);
                setSelecionados([]);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <section className={styles.toolbar} aria-label="Ações dos pedidos">
          <div className={styles.searchActions}>
            <div className={styles.menuContainer}>
              <button
                type="button"
                className={styles.optionsButton}
                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                aria-expanded={menuBuscaAberto}
                aria-controls="campos-busca-pedidos"
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
                  id="campos-busca-pedidos"
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
                placeholder="Buscar nos pedidos..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar nos pedidos"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro
                ariaLabel="Filtrar pedidos por status"
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
                  {statusDisponiveis.map(([valor, label]) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={valor}
                      className={
                        statusFiltrado === valor ? styles.selectedOption : ""
                      }
                      onClick={() => {
                        setStatusFiltrado(valor);
                        setFiltroAberto(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionControls}>
            <div className={styles.actionButtons}>
              <Button
                icone="adicionar"
                onClick={() => navigate("/verMaisPedido")}
              >
                Adicionar
              </Button>
              <Button
                estilo="editar"
                disabled={selecionados.length === 0}
                onClick={gerarEtiquetaSelecionados}
              >
                Gerar Etiqueta
              </Button>
              <select
                className={styles.statusSelect}
                aria-label="Alterar status dos pedidos selecionados"
                defaultValue=""
                disabled={selecionados.length === 0}
                onChange={alterarStatusSelecionados}
              >
                <option value="" disabled>
                  Alterar Status
                </option>
                <option>Em Andamento</option>
                <option>Concluída</option>
                <option>Cancelada</option>
              </select>

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
          </div>
        </section>

        <section className={styles.tableSection} aria-label="Lista de pedidos">
          <Table
            key={`${tabAtiva}-${busca}-${campoBusca}-${statusFiltrado}`}
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

export default Pedidos;