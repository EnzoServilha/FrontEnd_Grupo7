import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import { solicitarEtiquetas } from "../provider/etiquetas";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import TablePaginada from "../components/TablePaginada";
import styles from "./Pecas.module.css";

const camposBusca = [
  ["codigo", "Código interno/associado"],
  ["localizacao", "Localização"],
];

const TAMANHO_CARGA = 1000;
const ITENS_POR_PAGINA = 10;
const OPCOES_ITENS_POR_PAGINA = [10, 25, 50, 100];
const ATRASO_BUSCA_MS = 400;

const FILTROS_VAZIOS = {
  marcas: [],
  dataModo: "qualquer", // "qualquer" | "especifica" | "periodo"
  dataInicial: "",
  dataFinal: "",
  anoModo: "qualquer", // "qualquer" | "especifica" | "periodo"
  anoInicial: "",
  anoFinal: "",
};

const filtrosAtivos = (f) =>
  f.marcas.length > 0 || f.dataModo !== "qualquer" || f.anoModo !== "qualquer";

const filtrosValidos = (f) => {
  const dataOk =
    f.dataModo === "qualquer" ||
    (f.dataModo === "especifica" && Boolean(f.dataInicial)) ||
    (f.dataModo === "periodo" &&
      Boolean(f.dataInicial) &&
      Boolean(f.dataFinal) &&
      f.dataInicial <= f.dataFinal);

  const anoOk =
    f.anoModo === "qualquer" ||
    (f.anoModo === "especifica" && f.anoInicial !== "") ||
    (f.anoModo === "periodo" &&
      f.anoInicial !== "" &&
      f.anoFinal !== "" &&
      Number(f.anoInicial) <= Number(f.anoFinal));

  return dataOk && anoOk;
};

const isoParaBr = (iso) => iso.split("-").reverse().join("/");

const resumoFiltros = (f) => {
  const partes = [];
  if (f.marcas.length) partes.push(`Marca: ${f.marcas.join(", ")}`);
  if (f.dataModo === "especifica") partes.push(`Cadastro em ${isoParaBr(f.dataInicial)}`);
  if (f.dataModo === "periodo")
    partes.push(`Cadastro de ${isoParaBr(f.dataInicial)} a ${isoParaBr(f.dataFinal)}`);
  if (f.anoModo === "especifica") partes.push(`Ano ${f.anoInicial}`);
  if (f.anoModo === "periodo") partes.push(`Ano de ${f.anoInicial} a ${f.anoFinal}`);
  return partes.join(" · ");
};

// URLSearchParams repete a chave (marca=a&marca=b), que é o que o Spring espera
// para List<String>. O axios sozinho enviaria marca[]=a.
const montarParametrosBusca = (filtros, extras = {}) => {
  const params = new URLSearchParams();

  filtros.marcas.forEach((marca) => params.append("marca", marca));

  if (filtros.dataModo !== "qualquer") {
    params.append("dataCadastroInicial", filtros.dataInicial);
    params.append(
      "dataCadastroFinal",
      filtros.dataModo === "especifica" ? filtros.dataInicial : filtros.dataFinal,
    );
  }

  if (filtros.anoModo !== "qualquer") {
    params.append("anoCadastroInicial", filtros.anoInicial);
    params.append(
      "anoCadastroFinal",
      filtros.anoModo === "especifica" ? filtros.anoInicial : filtros.anoFinal,
    );
  }

  Object.entries(extras).forEach(([chave, valor]) => params.append(chave, valor));
  return params;
};

// Aceita Page (content) ou lista simples
const extrairLista = (resposta) =>
  Array.isArray(resposta.data)
    ? resposta.data
    : Array.isArray(resposta.data?.content)
      ? resposta.data.content
      : [];

async function buscarItens({ termo, campoBusca, filtros, ordenacao }) {
  // Sem busca e sem filtro: lista paginada do back, já ordenada por ele
  if (!termo && !filtrosAtivos(filtros)) {
    const params = { page: 0, size: TAMANHO_CARGA };
    if (ordenacao) params.sort = `${ordenacao.campo},${ordenacao.direcao}`;
    return extrairLista(await api.get("/itens", { params }));
  }

  const buscar = async (extras) =>
    extrairLista(
      await api.get("/itens/buscar", {
        params: montarParametrosBusca(filtros, extras),
      }),
    );

  if (!termo) return buscar({});

  if (campoBusca === "localizacao") return buscar({ localizacao: termo });

  // Código interno OU associado: duas consultas, unidas por id
  const resultados = await Promise.allSettled([
    buscar({ codigoInterno: termo }),
    buscar({ codigoAssociado: termo }),
  ]);

  const listas = resultados
    .filter((resultado) => resultado.status === "fulfilled")
    .map((resultado) => resultado.value);

  if (listas.length === 0) throw resultados[0].reason;

  const unicos = new Map();
  listas.flat().forEach((item) => unicos.set(item.id, item));
  return [...unicos.values()];
}

const valorPadrao = (valor, fallback = "---") => {
  if (valor === null || valor === undefined || valor === "") return fallback;
  return valor;
};

const formatarData = (valor) => {
  if (!valor) return "---";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return data.toLocaleDateString("pt-BR");
};

const normalizarPeca = (item, quantidadeMovimentacao = null) => {
  const codigosAssociados = Array.isArray(item?.codigosAssociados)
    ? item.codigosAssociados.length
    : Number.isFinite(Number(item?.codigosAssociados))
      ? Number(item.codigosAssociados)
      : 0;

  const quantidade = Number.isFinite(Number(quantidadeMovimentacao))
    ? Number(quantidadeMovimentacao)
    : null;

  return {
    id: item?.id ?? null,
    codigoInterno: valorPadrao(item?.codigoInterno),
    codigosAssociados,
    quantidade: quantidade ?? "---",
    localizacao: valorPadrao(item?.localizacao),
    precoCompra: valorPadrao(item?.precoCompra, "---"),
    precoVenda: valorPadrao(item?.precoVenda, "---"),
    marca: valorPadrao(item?.marca),
    dataCadastro: formatarData(item?.dataCadastro),
    anoFabricacao: valorPadrao(item?.ano ?? item?.anoFabricacao, "---"),
  };
};

function Pecas() {
  const navigate = useNavigate();
  const [pecas, setPecas] = useState([]);
  const [marcasDisponiveis, setMarcasDisponiveis] = useState([]);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [campoBusca, setCampoBusca] = useState("codigo");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [rascunhoFiltros, setRascunhoFiltros] = useState(FILTROS_VAZIOS);
  const [selecionadas, setSelecionadas] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [solicitandoEtiqueta, setSolicitandoEtiqueta] = useState(false);
  const [feedbackEtiqueta, setFeedbackEtiqueta] = useState(null);
  const [ordenacao, setOrdenacao] = useState(null); // { campo, direcao }
  // Guarda a quantidade por id para não refazer as N requisições a cada consulta
  const quantidadesRef = useRef(new Map());

  const gerarEtiquetaSelecionados = async () => {
    if (selecionadas.length === 0) return;
    await api.get("/etiquetas/{itemId}/pdf", { params })
  };

  // Espera o usuário parar de digitar antes de consultar o back
  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;

    const carregarPecas = async () => {
      try {
        const termo = buscaAplicada.trim();
        const semFiltro = !termo && !filtrosAtivos(filtros);

        const itens = await buscarItens({ termo, campoBusca, filtros, ordenacao });

        const itensComQuantidade = await Promise.all(
          itens.map(async (item) => {
            if (quantidadesRef.current.has(item.id)) {
              return normalizarPeca(item, quantidadesRef.current.get(item.id));
            }

            try {
              const respostaMovimentacao = await api.get(
                `/itensNaMovimentacao/item/${item.id}`,
              );
              const ocorrencias = Array.isArray(respostaMovimentacao.data)
                ? respostaMovimentacao.data
                : [];
              const quantidade = ocorrencias.reduce((soma, ocorrencia) => {
                const qtd = Number(ocorrencia?.qtd ?? 0);
                return Number.isFinite(qtd) ? soma + qtd : soma;
              }, 0);

              quantidadesRef.current.set(item.id, quantidade);
              return normalizarPeca(item, quantidade);
            } catch {
              return normalizarPeca(item, null);
            }
          }),
        );

        // Ignora respostas antigas se a consulta mudou no meio do caminho
        if (cancelado) return;

        setPecas(itensComQuantidade);

        // A lista de marcas do filtro vem da carga completa (sem busca/filtro),
        // senão ela encolheria junto com o resultado.
        if (semFiltro) {
          setMarcasDisponiveis(
            [
              ...new Set(
                itensComQuantidade
                  .map((peca) => peca.marca)
                  .filter((marca) => marca && marca !== "---"),
              ),
            ].sort((a, b) => a.localeCompare(b, "pt-BR")),
          );
        }
      } catch (error) {
        console.error("Erro ao buscar itens:", error);
        if (!cancelado) setPecas([]);
      }
    };

    carregarPecas();

    return () => {
      cancelado = true;
    };
  }, [ordenacao, buscaAplicada, campoBusca, filtros]);

  const ordenarNoBack = (campo, direcao) => setOrdenacao({ campo, direcao });

  // O /itens/buscar não recebe sort: com busca ou filtro ativos a ordenação
  // das colunas volta a ser feita no front.
  const ordenaNoBack = !buscaAplicada.trim() && !filtrosAtivos(filtros);
  const campoOrdenacao = (nome) => (ordenaNoBack ? nome : undefined);

  const alternarFiltro = () => {
    setFiltroAberto((aberto) => {
      if (!aberto) setRascunhoFiltros(filtros);
      return !aberto;
    });
    setMenuBuscaAberto(false);
  };

  const atualizarRascunho = (alteracao) =>
    setRascunhoFiltros((atual) => ({ ...atual, ...alteracao }));

  const alternarMarca = (marca) =>
    setRascunhoFiltros((atual) => ({
      ...atual,
      marcas: atual.marcas.includes(marca)
        ? atual.marcas.filter((item) => item !== marca)
        : [...atual.marcas, marca],
    }));

  const aplicarFiltros = () => {
    if (!filtrosValidos(rascunhoFiltros)) return;
    setFiltros(rascunhoFiltros);
    setSelecionadas([]);
    setFiltroAberto(false);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setRascunhoFiltros(FILTROS_VAZIOS);
    setSelecionadas([]);
    setFiltroAberto(false);
  };

  const abrirDetalhes = (peca) => {
    navigate(`/verMaisPeca?id=${peca.id}`, { state: { peca } });
  };

  const excluirSelecionadas = async () => {
    if (selecionadas.length === 0) {
      setModalExcluirAberto(false);
      return;
    }

    try {
      await Promise.all(
        selecionadas.map((id) => api.patch(`/itens/${id}/desativacao`)),
      );

      const idsSelecionados = new Set(selecionadas);
      setPecas((itensAtuais) =>
        itensAtuais.filter((peca) => !idsSelecionados.has(peca.id)),
      );
      setSelecionadas([]);
    } catch (error) {
      console.error("Erro ao desativar peças:", error);
    } finally {
      setModalExcluirAberto(false);
    }
  };

  const editarSelecionada = () => {
    const peca = pecas.find((item) => item.id === selecionadas[0]);
    if (peca) {
      navigate("/cadastrarPeca", {
        state: { item: peca, modoEdicao: true },
      });
    }
  };

  const gerarEtiquetaSelecionados = async () => {
    if (selecionadas.length === 0 || solicitandoEtiqueta) return;

    setSolicitandoEtiqueta(true);
    setFeedbackEtiqueta(null);

    try {
      setFeedbackEtiqueta(await solicitarEtiquetas(selecionadas));
    } finally {
      setSolicitandoEtiqueta(false);
    }
  };

  const columns = [
    { name: "Código Interno", ordena: false, tipo: "string" },
    { name: "Quantidade em Estoque", ordena: true, tipo: "number" }, // sempre local
    { name: "Localização", ordena: false, tipo: "string" },
    { name: "Preço Médio de Compra", ordena: true, tipo: "number", campoOrdenacao: campoOrdenacao("precoCompra") },
    { name: "Preço Médio de Venda", ordena: true, tipo: "number", campoOrdenacao: campoOrdenacao("precoVenda") },
    { name: "Marca", ordena: false, tipo: "string" },
    { name: "Data de Cadastro", ordena: true, tipo: "date", campoOrdenacao: campoOrdenacao("dataCadastro") },
    { name: "Ano de Fabricação", ordena: true, tipo: "number", campoOrdenacao: campoOrdenacao("ano") },
  ];

  const rows = pecas.map((peca) => {
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
            onClick={() => navigate("/pecas")}
          >
            Catálogo de Peças
          </button>
          <button
            type="button"
            role="tab"
            aria-selected="false"
            onClick={() => navigate("/entradasESaidas")}
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
                campo={campoBuscaAtivo}
                placeholder="Digite para buscar..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar no catálogo de peças"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro ariaLabel="Filtrar peças" onClick={alternarFiltro} />

              {filtroAberto && (
                <div
                  className={`${styles.popover} ${styles.filterPopover} ${styles.filterPanel}`}
                  role="dialog"
                  aria-label="Filtros do catálogo"
                >
                  <fieldset className={styles.filterGroup}>
                    <legend>Marca</legend>
                    <div className={styles.brandList}>
                      {marcasDisponiveis.length === 0 && (
                        <span className={styles.filterHint}>
                          Nenhuma marca disponível
                        </span>
                      )}
                      {marcasDisponiveis.map((marca) => (
                        <label key={marca} className={styles.checkOption}>
                          <input
                            type="checkbox"
                            checked={rascunhoFiltros.marcas.includes(marca)}
                            onChange={() => alternarMarca(marca)}
                          />
                          {marca}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className={styles.filterGroup}>
                    <legend>Data de cadastro</legend>
                    <select
                      value={rascunhoFiltros.dataModo}
                      onChange={(event) =>
                        atualizarRascunho({ dataModo: event.target.value })
                      }
                    >
                      <option value="qualquer">Qualquer data</option>
                      <option value="especifica">Data específica</option>
                      <option value="periodo">Entre duas datas</option>
                    </select>

                    {rascunhoFiltros.dataModo !== "qualquer" && (
                      <div className={styles.rangeRow}>
                        <input
                          type="date"
                          aria-label={
                            rascunhoFiltros.dataModo === "periodo"
                              ? "Data inicial"
                              : "Data de cadastro"
                          }
                          value={rascunhoFiltros.dataInicial}
                          onChange={(event) =>
                            atualizarRascunho({ dataInicial: event.target.value })
                          }
                        />
                        {rascunhoFiltros.dataModo === "periodo" && (
                          <>
                            <span>até</span>
                            <input
                              type="date"
                              aria-label="Data final"
                              value={rascunhoFiltros.dataFinal}
                              min={rascunhoFiltros.dataInicial || undefined}
                              onChange={(event) =>
                                atualizarRascunho({ dataFinal: event.target.value })
                              }
                            />
                          </>
                        )}
                      </div>
                    )}
                  </fieldset>

                  <fieldset className={styles.filterGroup}>
                    <legend>Ano de fabricação</legend>
                    <select
                      value={rascunhoFiltros.anoModo}
                      onChange={(event) =>
                        atualizarRascunho({ anoModo: event.target.value })
                      }
                    >
                      <option value="qualquer">Qualquer ano</option>
                      <option value="especifica">Ano específico</option>
                      <option value="periodo">Entre dois anos</option>
                    </select>

                    {rascunhoFiltros.anoModo !== "qualquer" && (
                      <div className={styles.rangeRow}>
                        <input
                          type="number"
                          min="1900"
                          max="2100"
                          placeholder="Ex.: 2018"
                          aria-label={
                            rascunhoFiltros.anoModo === "periodo"
                              ? "Ano inicial"
                              : "Ano de fabricação"
                          }
                          value={rascunhoFiltros.anoInicial}
                          onChange={(event) =>
                            atualizarRascunho({ anoInicial: event.target.value })
                          }
                        />
                        {rascunhoFiltros.anoModo === "periodo" && (
                          <>
                            <span>até</span>
                            <input
                              type="number"
                              min="1900"
                              max="2100"
                              placeholder="Ex.: 2024"
                              aria-label="Ano final"
                              value={rascunhoFiltros.anoFinal}
                              onChange={(event) =>
                                atualizarRascunho({ anoFinal: event.target.value })
                              }
                            />
                          </>
                        )}
                      </div>
                    )}
                  </fieldset>

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
                      disabled={!filtrosValidos(rascunhoFiltros)}
                      onClick={aplicarFiltros}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className={styles.actionButtons}>
            <Button
              estilo="editar"
              disabled={selecionadas.length === 0 || solicitandoEtiqueta}
              onClick={gerarEtiquetaSelecionados}
            >
              {solicitandoEtiqueta ? "Enviando..." : "Gerar Etiqueta"}
            </Button>
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

        {feedbackEtiqueta && (
          <p
            role={feedbackEtiqueta.tipo === "erro" ? "alert" : "status"}
            className={`${styles.feedback} ${
              feedbackEtiqueta.tipo === "erro"
                ? styles.feedbackErro
                : styles.feedbackSucesso
            }`}
          >
            {feedbackEtiqueta.mensagem}
          </p>
        {filtrosAtivos(filtros) && (
          <div className={styles.activeFilters}>
            <span>{resumoFiltros(filtros)}</span>
            <button type="button" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        )}

        <section className={styles.tableSection} aria-label="Catálogo de peças">
          <TablePaginada
            columns={columns}
            rows={rows}
            removerNaOrdenacao={["unidades", "R$"]}
            itensPorPagina={ITENS_POR_PAGINA}
            opcoesItensPorPagina={OPCOES_ITENS_POR_PAGINA}
            onSortChange={ordenarNoBack}
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