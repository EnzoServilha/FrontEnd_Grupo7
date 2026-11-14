import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Header from "../components/Header";
import Button from "../components/Button";
import Kpi from "../components/Kpi";
import FilterButton from "../components/Filtro";
import Table from "../components/Table";
import SearchBar from "../components/SearchBar";
import DeleteModal from "../components/DeleteModal";
import ServerResponse from "../components/ServerResponse";
import styles from "./VerMaisCliente.module.css";
import detailStyles from "./VerMaisFornecedor.module.css";

const placeholder = "---";
const texto = (valor) => valor == null || valor === "" ? placeholder : String(valor);
const normalizar = (valor) => String(valor ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const moeda = (valor) => valor == null ? placeholder : Number(valor).toLocaleString(
  "pt-BR", { style: "currency", currency: "BRL" },
);

const dia = (valor) => {
  if (!valor) return null;
  const parte = String(valor).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parte)) return null;
  const timestamp = Date.parse(`${parte}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === parte
    ? timestamp : null;
};

const dataFormatada = (valor) => {
  const timestamp = dia(valor);
  return timestamp === null ? placeholder : new Date(timestamp).toLocaleDateString(
    "pt-BR", { timeZone: "UTC" },
  );
};

const mensagemErro = (erro, padrao) => {
  const mensagem = erro?.response?.data?.message;
  return typeof mensagem === "string" && mensagem.trim() ? mensagem : padrao;
};

const camposBusca = [
  ["todos", "Todos os campos"],
  ["status", "Status"],
  ["notaFiscal", "Nº Nota Fiscal"],
  ["valor", "Valor Total"],
];

const camposDaBusca = (mov, campo) => {
  if (campo === "status") return [mov.status?.nome];
  if (campo === "notaFiscal") return [mov.numeroNotaFiscal];
  if (campo === "valor") return [mov.valorTotal, moeda(mov.valorTotal)];
  return [
    mov.id, mov.status?.nome, mov.numeroNotaFiscal,
    mov.valorTotal, moeda(mov.valorTotal), moeda(mov.precoFrete),
    moeda(mov.totalGastoImpostos), moeda(mov.precoProdutos), mov.qtdItens,
    dataFormatada(mov.dataMovimentacao), dataFormatada(mov.dataEntrega),
    dataFormatada(mov.dataEntregaPrevista), mov.qtdDiasPrevistos, mov.qtdDiasReal,
  ];
};

const colunas = [
  { name: "Status", ordena: true, tipo: "string" },
  { name: "Valor Total", ordena: true, tipo: "number" },
  { name: "Pagador do Frete (mock)", ordena: false, tipo: "string" },
  { name: "Preço do Frete", ordena: true, tipo: "number" },
  { name: "Preço do Imposto", ordena: true, tipo: "number" },
  { name: "Preço dos Produtos", ordena: true, tipo: "number" },
  { name: "Qtd. Itens", ordena: true, tipo: "number" },
  { name: "Data da Entrega", ordena: true, tipo: "date" },
  { name: "Data Prevista", ordena: true, tipo: "date" },
  { name: "Data do Pedido", ordena: true, tipo: "date" },
  { name: "Qtd. Dias Previsto", ordena: true, tipo: "number" },
  { name: "Qtd. Dias Real", ordena: true, tipo: "number" },
  { name: "Nº Nota Fiscal", ordena: true, tipo: "string" },
  { name: "Ações", ordena: false, tipo: "string" },
];

function VerMaisFornecedor() {
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(location.state?.contato?.id ??
    new URLSearchParams(location.search).get("id"));
  const fornecedorId = Number.isInteger(id) && id > 0 ? id : null;
  const [dados, setDados] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [status, setStatus] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const exclusaoEmAndamento = useRef(false);
  const carregando = fornecedorId !== null && dados?.id !== fornecedorId;
  const fornecedor = dados?.id === fornecedorId ? dados.fornecedor : null;
  const compras = useMemo(() => dados?.id === fornecedorId ? dados.compras : [], [dados, fornecedorId]);

  useEffect(() => {
    if (fornecedorId === null) return undefined;
    let cancelado = false;

    const carregar = async () => {
      const [resultadoFornecedor, resultadoHistorico] = await Promise.allSettled([
        api.get(`/fornecedores/${fornecedorId}`).then(({ data }) => {
          if (!data || Number(data.id) !== fornecedorId) {
            throw new Error("Resposta inválida ao consultar fornecedor.");
          }
          return data;
        }),
        api.get("/movimentacoes/tipo/ENTRADA").then(({ data }) => {
          if (!Array.isArray(data)) {
            throw new Error("Resposta inválida ao consultar histórico.");
          }
          return data.filter((mov) => Number(mov.fornecedor?.id) === fornecedorId);
        }),
      ]);
      if (cancelado) return;
      let erroFornecedor = "";
      let erroHistorico = "";
      if (resultadoFornecedor.status === "rejected") {
        console.error("Erro ao carregar fornecedor:", resultadoFornecedor.reason);
        erroFornecedor = mensagemErro(resultadoFornecedor.reason, "Não foi possível carregar o fornecedor.");
      }
      if (resultadoHistorico.status === "rejected") {
        console.error("Erro ao carregar histórico de compras:", resultadoHistorico.reason);
        erroHistorico = mensagemErro(resultadoHistorico.reason, "Não foi possível carregar o histórico de compras.");
      }
      setDados({
        id: fornecedorId,
        fornecedor: resultadoFornecedor.status === "fulfilled" ? resultadoFornecedor.value : null,
        compras: resultadoHistorico.status === "fulfilled" ? resultadoHistorico.value : [],
        erroFornecedor,
        erroHistorico,
      });
    };
    carregar();
    return () => { cancelado = true; };
  }, [fornecedorId, tentativa]);

  const tentarNovamente = () => {
    setDados(null);
    setTentativa((valor) => valor + 1);
  };
  const voltar = () => navigate("/contatos", { state: { tipoAtivo: "fornecedores" } });

  const desativar = async () => {
    if (exclusaoEmAndamento.current || !fornecedor) return;
    exclusaoEmAndamento.current = true;
    setExcluindo(true);
    setErroExclusao("");
    try {
      await api.patch(`/fornecedores/${fornecedorId}/desativacao`);
      voltar();
    } catch (erro) {
      console.error("Erro ao desativar fornecedor:", erro);
      setErroExclusao(mensagemErro(erro, "Não foi possível desativar o fornecedor. Verifique sua permissão e tente novamente."));
    } finally {
      exclusaoEmAndamento.current = false;
      setExcluindo(false);
    }
  };

  const indicadores = useMemo(() => {
    const entregues = compras.filter((mov) =>
      ["CONCLUIDO", "CONCLUIDO PARCIAL"].includes(mov.status?.nome) &&
      dia(mov.dataEntrega) !== null);
    const comPrevisao = entregues.filter((mov) => dia(mov.dataEntregaPrevista) !== null);
    const noPrazo = comPrevisao.filter((mov) => dia(mov.dataEntrega) <= dia(mov.dataEntregaPrevista));
    const tempos = entregues.flatMap((mov) => {
      const inicio = dia(mov.dataMovimentacao);
      const fim = dia(mov.dataEntrega);
      return inicio !== null && fim >= inicio ? [(fim - inicio) / 86400000] : [];
    }).sort((a, b) => a - b);
    const meio = Math.floor(tempos.length / 2);
    const mediana = tempos.length % 2 ? tempos[meio] : (tempos[meio - 1] + tempos[meio]) / 2;
    return {
      prazo: comPrevisao.length
        ? `${(noPrazo.length * 100 / comPrevisao.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
        : placeholder,
      mediana: tempos.length ? `${mediana.toLocaleString("pt-BR")} dias` : placeholder,
    };
  }, [compras]);

  const campoBuscaAtivo = camposBusca.find(([valor]) => valor === campoBusca)?.[1];

  const alternarFiltro = () => {
    setFiltrosAbertos((aberto) => !aberto);
    setMenuBuscaAberto(false);
  };

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setStatus("");
  };

  const statusDisponiveis = [...new Set(compras.map((mov) => mov.status?.nome).filter(Boolean))].sort();
  const intervaloInvalido = Boolean(dataInicio && dataFim && dataInicio > dataFim);
  const comprasFiltradas = compras.filter((mov) => {
    if (intervaloInvalido || (status && mov.status?.nome !== status)) return false;
    const dataPedido = mov.dataMovimentacao?.slice(0, 10);
    if (dataInicio && (!dataPedido || dataPedido < dataInicio)) return false;
    if (dataFim && (!dataPedido || dataPedido > dataFim)) return false;
    return camposDaBusca(mov, campoBusca).some((campo) =>
      normalizar(campo).includes(normalizar(busca.trim())));
  });
  const linhas = comprasFiltradas.map((mov) => ({
    id: mov.id,
    cells: [
      texto(mov.status?.nome), moeda(mov.valorTotal), "XXXXXXXXX",
      moeda(mov.precoFrete), moeda(mov.totalGastoImpostos), moeda(mov.precoProdutos),
      texto(mov.qtdItens), dataFormatada(mov.dataEntrega), dataFormatada(mov.dataEntregaPrevista),
      dataFormatada(mov.dataMovimentacao),
      dia(mov.dataEntregaPrevista) === null ? placeholder : texto(mov.qtdDiasPrevistos),
      dia(mov.dataEntrega) === null ? placeholder : texto(mov.qtdDiasReal),
      texto(mov.numeroNotaFiscal),
      <Button key={mov.id} estilo="verMais" onClick={() =>
        navigate("/verMaisPedido", { state: { pedido: mov } })}>Ver Mais</Button>,
    ],
  }));
  const endereco = fornecedor?.endereco;

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.content}>
        <div className={styles.headerCliente}>
          <div className={styles.titleGroup}>
            <button type="button" aria-label="Voltar para fornecedores" onClick={voltar}>
              <svg className={styles.backIcon} xmlns="http://www.w3.org/2000/svg"
                height="28px" viewBox="0 -960 960 960" width="28px" fill="#0f172a">
                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
              </svg>
            </button>
            <h1>Detalhes do Fornecedor</h1>
          </div>
          <div className={styles.actionButtons}>
            <Button icone="editar" estilo="editar" disabled={!fornecedor || excluindo}
              onClick={() => navigate("/cadastrarFornecedor", { state: { fornecedorId } })}>Editar</Button>
            <Button icone="deletar" estilo="deletar" disabled={!fornecedor || excluindo}
              onClick={() => setModalExcluirAberto(true)}>{excluindo ? "Desativando..." : "Deletar"}</Button>
          </div>
        </div>
        {erroExclusao && <div role="alert"><ServerResponse type="error"
          title="Falha ao desativar fornecedor" message={erroExclusao} /></div>}
        {fornecedorId === null ? (
          <ServerResponse type="error" title="Fornecedor não informado"
            message="Selecione um fornecedor na tela de contatos para visualizar os detalhes." />
        ) : carregando ? (
          <ServerResponse type="loading" title="Carregando fornecedor..." />
        ) : dados.erroFornecedor ? (
          <div role="alert"><ServerResponse type="error" title="Falha ao carregar fornecedor"
            message={dados.erroFornecedor} onRetry={tentarNovamente} /></div>
        ) : (
          <div className={styles.gridContainer}>
            <section className={styles.cardInfo}>
              <h2 className={styles.clientTitle}>{texto(fornecedor.nomeEmpresa)} - {texto(fornecedor.nomeContato)}</h2>
              <div className={styles.infoList}>
                <p><strong>Telefone:</strong> {texto(fornecedor.telefone)}</p>
                <p><strong>E-mail:</strong> {texto(fornecedor.email)}</p>
                <p><strong>CNPJ:</strong> {texto(fornecedor.cnpj)}</p>
                <p><strong>Razão Social:</strong> {texto(fornecedor.razaoSocial)}</p>
                <p><strong>Data Cadastro:</strong> {dataFormatada(fornecedor.dataCadastro)}</p>
              </div>
              <div className={styles.sectionBlock}>
                <h3>Observações:</h3>
                <p className={styles.observationText}>{texto(fornecedor.observacoes)}</p>
              </div>
              <div className={styles.sectionBlock}>
                <h3>Localização:</h3>
                <div className={styles.locationGrid}>
                  <div>
                    <p><strong>Estado:</strong> {texto(endereco?.uf)}</p>
                    <p><strong>Cidade:</strong> {texto(endereco?.cidade)}</p>
                    <p><strong>CEP:</strong> {texto(endereco?.cep)}</p>
                  </div>
                  <div>
                    <p><strong>Bairro:</strong> {texto(endereco?.bairro)}</p>
                    <p><strong>Logradouro:</strong> {texto(endereco?.logradouro)}</p>
                    <p><strong>Número:</strong> {texto(endereco?.numero)}</p>
                    <p><strong>Complemento:</strong> {texto(endereco?.complemento)}</p>
                  </div>
                </div>
              </div>
            </section>
            <div className={styles.rightColumn}>
              <section className={styles.kpiContainer}>
                <div className={styles.kpiRow}>
                  <Kpi title="Entregas dentro do Prazo" value={dados.erroHistorico ? placeholder : indicadores.prazo} />
                  <Kpi title="Entregas com Frete Pago (mock)" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value={dados.erroHistorico ? placeholder : indicadores.mediana} />
                </div>
              </section>
              <section className={`${styles.cardHistory} ${detailStyles.history}`}>
                <div className={styles.historyHeader}>
                  <h2>Histórico de Compras</h2>
                  <div className={`${styles.filterGroup} ${detailStyles.controls}`}>
                    <div className={detailStyles.menuContainer}>
                      <button
                        type="button"
                        className={detailStyles.optionsButton}
                        aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                        aria-expanded={menuBuscaAberto}
                        title={`Pesquisar por: ${campoBuscaAtivo}`}
                        onClick={() => {
                          setMenuBuscaAberto((aberto) => !aberto);
                          setFiltrosAbertos(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m7 10 5 5 5-5" />
                        </svg>
                      </button>

                      {menuBuscaAberto && (
                        <div className={detailStyles.popover} role="menu">
                          {camposBusca.map(([valor, label]) => (
                            <button
                              type="button"
                              role="menuitem"
                              key={valor}
                              className={`${detailStyles.menuItem} ${campoBusca === valor ? detailStyles.selectedOption : ""}`}
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

                    <div className={detailStyles.searchWrapper}>
                      <SearchBar
                        campo={campoBuscaAtivo}
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                        placeholder="Digite para buscar..."
                        ariaLabel="Pesquisar no histórico de compras"
                      />
                    </div>

                    <div className={`${detailStyles.menuContainer} ${detailStyles.filterContainer}`}>
                      <FilterButton ariaLabel="Filtrar histórico de compras" onClick={alternarFiltro} />

                      {filtrosAbertos && (
                        <div
                          className={`${detailStyles.popover} ${detailStyles.filterPopover}`}
                          role="dialog"
                          aria-label="Filtros do histórico"
                        >
                          <fieldset className={detailStyles.filterField}>
                            <legend>Status</legend>
                            <select
                              aria-label="Filtrar por status"
                              value={status}
                              onChange={(event) => setStatus(event.target.value)}
                            >
                              <option value="">Todos os status</option>
                              {statusDisponiveis.map((nome) => (
                                <option key={nome} value={nome}>{nome}</option>
                              ))}
                            </select>
                          </fieldset>

                          <fieldset className={detailStyles.filterField}>
                            <legend>Data do pedido</legend>
                            <div className={detailStyles.rangeRow}>
                              <input
                                type="date"
                                aria-label="Pedido de"
                                value={dataInicio}
                                onChange={(event) => setDataInicio(event.target.value)}
                              />
                              <span>até</span>
                              <input
                                type="date"
                                aria-label="Pedido até"
                                value={dataFim}
                                min={dataInicio || undefined}
                                onChange={(event) => setDataFim(event.target.value)}
                              />
                            </div>
                          </fieldset>

                          <div className={detailStyles.filterActions}>
                            <button type="button" className={detailStyles.clearButton} onClick={limparFiltros}>
                              Limpar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {intervaloInvalido && <p role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
                {dados.erroHistorico ? (
                  <div role="alert"><ServerResponse type="error" title="Falha ao carregar histórico"
                    message={dados.erroHistorico} onRetry={tentarNovamente} /></div>
                ) : linhas.length ? (
                  <div className={`${styles.tableWrapper} ${detailStyles.table}`}>
                    <Table columns={colunas} rows={linhas} selecionavel={false} removerNaOrdenacao="R$" />
                  </div>
                ) : (
                  <p role="status">{compras.length ? "Nenhuma compra corresponde aos filtros." : "Nenhuma compra encontrada para este fornecedor."}</p>
                )}
              </section>
            </div>
          </div>
        )}
        <DeleteModal isOpen={modalExcluirAberto} onClose={() => setModalExcluirAberto(false)}
          onConfirm={desativar} />
      </main>
    </div>
  );
}

export default VerMaisFornecedor;