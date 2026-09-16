import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Pedidos.module.css";

const placeholder = "---";

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

const normalizarTexto = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;
  return String(valor);
};

const formatarData = (valor) => {
  if (!valor) return placeholder;

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return normalizarTexto(valor);

  return data.toLocaleDateString("pt-BR");
};

const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return normalizarTexto(valor);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

const obterCategoria = (tipo = "") => {
  const texto = String(tipo).trim().toLowerCase();

  if (texto.includes("venda")) return "vendas";
  if (texto.includes("compra")) return "compras";
  if (texto.includes("cot")) return "cotacoes";

  return "todos";
};

const obterStatusClass = (status = "") => {
  const texto = String(status).trim().toLowerCase();

  if (texto.includes("atras")) return "atrasado";
  if (texto.includes("andamento") || texto.includes("em") || texto.includes("pend")) return "andamento";
  if (texto.includes("cancel")) return "cancelado";
  if (texto.includes("conclu")) return "concluido";
  if (texto.includes("cot")) return "completo";

  return "";
};

const normalizarPedido = (movimentacao) => {
  const tipo = normalizarTexto(movimentacao?.tipo?.nome ?? movimentacao?.tipo ?? "");
  const status = normalizarTexto(movimentacao?.status?.nome ?? movimentacao?.status ?? "");

  return {
    id: movimentacao?.id ?? null,
    tipo,
    categoria: obterCategoria(tipo),
    status,
    statusClass: obterStatusClass(status),
    valorTotal: formatarMoeda(movimentacao?.valorTotal),
    pagadorFrete:
      normalizarTexto(
        movimentacao?.cliente?.nome ?? movimentacao?.fornecedor?.razaoSocial ?? movimentacao?.pagadorFrete,
      ),
    precoFrete: formatarMoeda(movimentacao?.precoFrete),
    precoImposto: formatarMoeda(movimentacao?.totalGastoImpostos),
    precoProdutos: formatarMoeda(movimentacao?.precoProdutos),
    quantidade: movimentacao?.qtdItens ?? placeholder,
    dataEntrega: formatarData(movimentacao?.dataEntrega),
    dataPrevista: formatarData(movimentacao?.dataEntregaPrevista),
    dataPedido: formatarData(movimentacao?.dataMovimentacao),
  };
};

function Pedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [tabAtiva, setTabAtiva] = useState("todos");
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [statusFiltrado, setStatusFiltrado] = useState("todos");
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        setCarregando(true);

        const respostaPeriodo = await api.get("/periodos/ultimo");
        const periodoAtual = respostaPeriodo.data ?? null;

        let lista = [];

        if (periodoAtual?.id) {
          const respostaMovimentacoes = await api.get(`/movimentacoes/periodo/${periodoAtual.id}`);
          lista = Array.isArray(respostaMovimentacoes.data) ? respostaMovimentacoes.data : [];
        }

        setPedidos(lista.map(normalizarPedido));
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setPedidos([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarPedidos();
  }, []);

  const statusDisponiveis = useMemo(
    () => [
      ["todos", "Todos os status"],
      ...Array.from(new Set(pedidos.map((pedido) => pedido.status).filter(Boolean))).map((status) => [status, status]),
    ],
    [pedidos],
  );

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pedidos.filter((pedido) => {
      const correspondeATab =
        tabAtiva === "todos" || pedido.categoria === tabAtiva;
      const correspondeAoStatus =
        statusFiltrado === "todos" || pedido.status.toLowerCase().includes(statusFiltrado.toLowerCase());

      if (!correspondeATab || !correspondeAoStatus) return false;
      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? [
              pedido.tipo,
              pedido.status,
              pedido.valorTotal,
              pedido.pagadorFrete,
              pedido.precoFrete,
              pedido.precoImposto,
              pedido.precoProdutos,
              pedido.quantidade,
              pedido.dataEntrega,
              pedido.dataPrevista,
              pedido.dataPedido,
            ]
          : [pedido[campoBusca]];

      return valores.some((valor) =>
        String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [busca, campoBusca, pedidos, statusFiltrado, tabAtiva]);

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

  const rows = pedidosFiltrados.map((pedido) => [
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
  ]);

  const campoBuscaAtivo = camposBusca.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  const rowsExibidos = rows.length ? rows : [[placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder]];

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
              onClick={() => setTabAtiva(valor)}
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
            <select
              className={styles.statusSelect}
              aria-label="Alterar status dos pedidos selecionados"
              defaultValue=""
            >
              <option value="" disabled>
                Alterar Status
              </option>
              <option>Em Andamento</option>
              <option>Concluída</option>
              <option>Cancelada</option>
            </select>

            <div className={styles.actionButtons}>
              <Button
                icone="adicionar"
                onClick={() => navigate("/cadastrarPedido")}
              >
                Adicionar
              </Button>
              <Button
                icone="editar"
                estilo="editar"
                onClick={() => navigate("/verMaisPedido")}
              >
                Editar
              </Button>
              <Button
                icone="deletar"
                estilo="deletar"
                onClick={() => setModalExcluirAberto(true)}
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
            rows={carregando ? [[placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder]] : rowsExibidos}
          />
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={() => setModalExcluirAberto(false)}
      />
    </div>
  );
}

export default Pedidos;
