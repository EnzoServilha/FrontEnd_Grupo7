import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import TablePaginada from "../components/TablePaginada";
import styles from "./Pedidos.module.css";

const placeholder = "---";
const ITENS_POR_PAGINA = 10;
const OPCOES_ITENS_POR_PAGINA = [10, 25, 50, 100];

const tabs = [
  ["todos", "Todos"],
  ["saida", "Saídas"],
  ["entrada", "Entradas"],
  ["cotacoes", "Cotações"],
];

const FILTROS_VAZIOS = {
  tipo: "", // valor bruto do back ("" = qualquer)
  status: "", // valor bruto do back ("" = qualquer)
  dataEntrega: "", // yyyy-mm-dd
  dataPrevista: "", // yyyy-mm-dd
  dataPedido: "", // yyyy-mm-dd (enviada como dataMovimentacao)
  pagadorFrete: "", // "" | "true" | "false"
};

const filtrosAtivos = (f) => Object.values(f).some((valor) => valor !== "");

const normalizarTexto = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;
  if (valor === "SAIDA") return "SAÍDA";
  return String(valor);
};

const isoParaBr = (iso) => iso.split("-").reverse().join("/");

const resumoFiltros = (f) => {
  const partes = [];
  if (f.tipo) partes.push(`Tipo: ${normalizarTexto(f.tipo)}`);
  if (f.status) partes.push(`Status: ${normalizarTexto(f.status)}`);
  if (f.dataEntrega) partes.push(`Entrega em ${isoParaBr(f.dataEntrega)}`);
  if (f.dataPrevista) partes.push(`Prevista para ${isoParaBr(f.dataPrevista)}`);
  if (f.dataPedido) partes.push(`Pedido em ${isoParaBr(f.dataPedido)}`);
  if (f.pagadorFrete) {
    partes.push(`Pagador do frete: ${f.pagadorFrete === "true" ? "Sim" : "Não"}`);
  }
  return partes.join(" · ");
};

// Nome vindo do back: pode ser objeto ({ nome }) ou texto simples
const nomeBruto = (valor) => valor?.nome ?? valor ?? "";

const nomesUnicos = (lista, campo) =>
  [...new Set(lista.map((item) => nomeBruto(item?.[campo])).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );

const montarParametrosBusca = (f) => {
  const params = {};
  if (f.tipo) params.tipo = f.tipo;
  if (f.status) params.status = f.status;
  if (f.dataEntrega) params.dataEntrega = f.dataEntrega;
  if (f.dataPrevista) params.dataPrevista = f.dataPrevista;
  if (f.dataPedido) params.dataMovimentacao = f.dataPedido;
  if (f.pagadorFrete) params.pagadorFrete = f.pagadorFrete;
  return params;
};

async function buscarMovimentacoes(filtros) {
  // Com filtro: endpoint de busca do back
  if (filtrosAtivos(filtros)) {
    const resposta = await api.get("/movimentacoes/buscar", {
      params: montarParametrosBusca(filtros),
    });
    return Array.isArray(resposta.data) ? resposta.data : [];
  }

  // Sem filtro: movimentações do período atual
  const respostaPeriodo = await api.get("/periodos/ultimo");
  const periodoAtual = respostaPeriodo.data ?? null;
  if (!periodoAtual?.id) return [];

  const resposta = await api.get(`/movimentacoes/periodo/${periodoAtual.id}`);
  return Array.isArray(resposta.data) ? resposta.data : [];
}

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

  if (texto.includes("saída")) return "saida";
  if (texto.includes("entrada")) return "entrada";
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
    usuarioCriador: normalizarTexto(movimentacao?.usuario?.nome),
    movimentacaoOriginalId: movimentacao?.id ?? null
  };
};

function Pedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosOriginais, setPedidosOriginais] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [tabAtiva, setTabAtiva] = useState("todos");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [rascunhoFiltros, setRascunhoFiltros] = useState(FILTROS_VAZIOS);
  const [tiposDisponiveis, setTiposDisponiveis] = useState([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState([]);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);


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

  const editarSelecionado = () => {
    const pedidoOriginal = pedidosOriginais.find((item) => item.id === selecionados[0]);
    if (pedidoOriginal) navigate("/verMaisPedido", { state: { pedido: pedidoOriginal } });
  };

  useEffect(() => {
    let cancelado = false;

    const carregarPedidos = async () => {
      try {
        setCarregando(true);

        const lista = await buscarMovimentacoes(filtros);

        // Ignora respostas antigas se os filtros mudaram no meio do caminho
        if (cancelado) return;

        setPedidosOriginais(lista);
        setPedidos(lista.map(normalizarPedido));

        // As opções de tipo e status vêm da carga sem filtro,
        // senão elas encolheriam junto com o resultado.
        if (!filtrosAtivos(filtros)) {
          setTiposDisponiveis(nomesUnicos(lista, "tipo"));
          setStatusDisponiveis(nomesUnicos(lista, "status"));
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        if (!cancelado) {
          setPedidosOriginais([]);
          setPedidos([]);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    carregarPedidos();

    return () => {
      cancelado = true;
    };
  }, [filtros]);

  const alternarFiltro = () => {
    setFiltroAberto((aberto) => {
      if (!aberto) setRascunhoFiltros(filtros);
      return !aberto;
    });
  };

  const atualizarRascunho = (alteracao) =>
    setRascunhoFiltros((atual) => ({ ...atual, ...alteracao }));

  const aplicarFiltros = () => {
    setFiltros(rascunhoFiltros);
    setSelecionados([]);
    setFiltroAberto(false);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setRascunhoFiltros(FILTROS_VAZIOS);
    setSelecionados([]);
    setFiltroAberto(false);
  };

  // As abas filtram no front, sobre o que o back devolveu
  const pedidosFiltrados = useMemo(
    () =>
      pedidos.filter(
        (pedido) => tabAtiva === "todos" || pedido.categoria === tabAtiva,
      ),
    [pedidos, tabAtiva],
  );

  const originaisPorId = useMemo(
    () => new Map(pedidosOriginais.map((original) => [original.id, original])),
    [pedidosOriginais],
  );

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
    { name: "Usuário Criador", ordena: false, tipo: "string" },
  ];

  const rowIds = pedidosFiltrados.map((pedido) => pedido.id);

  const rows = pedidosFiltrados.map((pedido) => {
    const original = originaisPorId.get(pedido.id);
    return [
      <button
        type="button"
        className={styles.tableLink}
        onClick={() => navigate("/verMaisPedido", { state: { pedido: original ?? pedido } })}
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
      pedido.usuarioCriador,
    ];
  });

  const cancelarSelecionados = async () => {
    if (selecionados.length === 0) {
      setModalExcluirAberto(false);
      return;
    }

    try {
      await Promise.all(
        selecionados.map((id) => api.patch(`/movimentacoes/${id}/cancelamento`)),
      );

      const idsSelecionados = new Set(selecionados);
      setPedidos((listaAtual) =>
        listaAtual.filter((pedido) => !idsSelecionados.has(pedido.id)),
      );
      setSelecionados([]);
    } catch (error) {
      console.error("Erro ao cancelar pedidos:", error);
    } finally {
      setModalExcluirAberto(false);
    }
  };

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
              <Filtro ariaLabel="Filtrar pedidos" onClick={alternarFiltro} />

              {filtroAberto && (
                <div
                  className={`${styles.popover} ${styles.filterPanel}`}
                  role="dialog"
                  aria-label="Filtros dos pedidos"
                >
                  <div className={styles.filterGrid}>
                    <label className={styles.filterField}>
                      <span>Tipo</span>
                      <select
                        value={rascunhoFiltros.tipo}
                        onChange={(event) =>
                          atualizarRascunho({ tipo: event.target.value })
                        }
                      >
                        <option value="">Qualquer tipo</option>
                        {tiposDisponiveis.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {normalizarTexto(tipo)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.filterField}>
                      <span>Status</span>
                      <select
                        value={rascunhoFiltros.status}
                        onChange={(event) =>
                          atualizarRascunho({ status: event.target.value })
                        }
                      >
                        <option value="">Qualquer status</option>
                        {statusDisponiveis.map((status) => (
                          <option key={status} value={status}>
                            {normalizarTexto(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.filterField}>
                      <span>Data de entrega</span>
                      <input
                        type="date"
                        value={rascunhoFiltros.dataEntrega}
                        onChange={(event) =>
                          atualizarRascunho({ dataEntrega: event.target.value })
                        }
                      />
                    </label>

                    <label className={styles.filterField}>
                      <span>Data prevista</span>
                      <input
                        type="date"
                        value={rascunhoFiltros.dataPrevista}
                        onChange={(event) =>
                          atualizarRascunho({ dataPrevista: event.target.value })
                        }
                      />
                    </label>

                    <label className={styles.filterField}>
                      <span>Data do pedido</span>
                      <input
                        type="date"
                        value={rascunhoFiltros.dataPedido}
                        onChange={(event) =>
                          atualizarRascunho({ dataPedido: event.target.value })
                        }
                      />
                    </label>

                    <label className={styles.filterField}>
                      <span>Pagador do frete</span>
                      <select
                        value={rascunhoFiltros.pagadorFrete}
                        onChange={(event) =>
                          atualizarRascunho({ pagadorFrete: event.target.value })
                        }
                      >
                        <option value="">Qualquer</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.filterActions}>
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={limparFiltros}
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      className={styles.applyButton}
                      onClick={aplicarFiltros}
                    >
                      Aplicar
                    </button>
                  </div>
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
              <option value="2">Concluído</option>
              <option value="3">Concluído Parcialmente</option>
              <option value="4">Cancelado</option>
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

        {filtrosAtivos(filtros) && (
          <div className={styles.activeFilters}>
            <span>{resumoFiltros(filtros)}</span>
            <button type="button" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        )}

        <section className={styles.tableSection} aria-label="Lista de pedidos">
          <TablePaginada
            key={tabAtiva}
            columns={columns}
            rows={rows}
            rowIds={rowIds}
            removerNaOrdenacao="R$"
            itensPorPagina={ITENS_POR_PAGINA}
            opcoesItensPorPagina={OPCOES_ITENS_POR_PAGINA}
            onSelectionChange={setSelecionados}
          />

          {carregando && (
            <p className={styles.tableMessage}>Carregando pedidos...</p>
          )}
          {!carregando && rows.length === 0 && (
            <p className={styles.tableMessage}>Nenhum pedido encontrado.</p>
          )}
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={cancelarSelecionados}
      />
    </div>
  );
}

export default Pedidos;