import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import ServerResponse from "../components/ServerResponse";
import Table from "../components/Table";
import { api } from "../provider/api";
import styles from "./Periodo.module.css";

const camposBusca = [
  ["numero", "Número"],
  ["anotacoes", "Anotações"],
];

const ATRASO_BUSCA_MS = 400;

const FILTROS_VAZIOS = {
  dataModo: "qualquer", // "qualquer" | "especifica" | "periodo"
  dataInicial: "",
  dataFinal: "",
};

const filtrosAtivos = (f) => f.dataModo !== "qualquer";

const filtrosValidos = (f) => {
  const dataOk =
    f.dataModo === "qualquer" ||
    (f.dataModo === "especifica" && Boolean(f.dataInicial)) ||
    (f.dataModo === "periodo" &&
      Boolean(f.dataInicial) &&
      Boolean(f.dataFinal) &&
      f.dataInicial <= f.dataFinal);

  return dataOk;
};

const isoParaBr = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

const resumoFiltros = (f) => {
  const partes = [];
  if (f.dataModo === "especifica") partes.push(`Cadastro em ${isoParaBr(f.dataInicial)}`);
  if (f.dataModo === "periodo")
    partes.push(`Cadastro de ${isoParaBr(f.dataInicial)} a ${isoParaBr(f.dataFinal)}`);
  return partes.join(" · ");
};

const montarParametrosBusca = (filtros, extras = {}) => {
  const params = new URLSearchParams();

  if (filtros.dataModo !== "qualquer") {
    params.append("dataCadastroInicial", filtros.dataInicial);
    params.append(
      "dataCadastroFinal",
      filtros.dataModo === "especifica" ? filtros.dataInicial : filtros.dataFinal,
    );
  }

  Object.entries(extras).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.append(chave, valor);
    }
  });
  return params;
};

// "2026-10-07T15:12:42" -> "07/10/2026"
function formatarDataApi(valor) {
  if (!valor) return "---";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function mapearPeriodo(periodo) {
  return {
    id: periodo.id,
    numero: String(periodo.id).padStart(2, "0"),
    dataCadastro: formatarDataApi(periodo.dataCriacao),
    totalPecas: periodo.qtdPecas ?? 0,
    anotacoes: periodo.anotacao || "Sem anotações",
    fechado: periodo.fechado,
    dataFechamento: periodo.dataFechamento,
  };
}

function Periodo() {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [campoBusca, setCampoBusca] = useState("numero");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [rascunhoFiltros, setRascunhoFiltros] = useState(FILTROS_VAZIOS);
  const [selecionados, setSelecionados] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  // Espera o usuário parar de digitar antes de consultar a API
  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [busca]);

  const carregarPeriodos = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const termo = buscaAplicada.trim();
      let resposta;

      if (!termo && !filtrosAtivos(filtros)) {
        resposta = await api.get("/periodos");
      } else {
        const extras = {};
        if (termo) {
          if (campoBusca === "numero") {
            extras.numero = termo;
          } else if (campoBusca === "anotacoes") {
            extras.anotacao = termo;
          }
        }
        resposta = await api.get("/periodos/buscar", {
          params: montarParametrosBusca(filtros, extras),
        });
      }

      const lista = Array.isArray(resposta.data) ? resposta.data : [];
      setPeriodos(lista.map(mapearPeriodo));
    } catch (error) {
      console.error("Erro ao buscar períodos:", error);
      setErro("Não foi possível carregar os períodos.");
      setPeriodos([]);
    } finally {
      setCarregando(false);
    }
  }, [buscaAplicada, campoBusca, filtros]);

  useEffect(() => {
    carregarPeriodos();
  }, [carregarPeriodos]);

  const alternarFiltro = () => {
    setFiltroAberto((aberto) => {
      if (!aberto) setRascunhoFiltros(filtros);
      return !aberto;
    });
    setMenuBuscaAberto(false);
  };

  const atualizarRascunho = (alteracao) =>
    setRascunhoFiltros((atual) => ({ ...atual, ...alteracao }));

  const aplicarFiltros = () => {
    if (!filtrosValidos(rascunhoFiltros)) return;
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

  const excluirSelecionados = () => {
    setPeriodos((itensAtuais) =>
      itensAtuais.filter((periodo) => !selecionados.includes(periodo.id)),
    );
    setSelecionados([]);
    setModalExcluirAberto(false);
  };

  const columns = [
    { name: "Número", ordena: false, tipo: "string" },
    { name: "Data de cadastro", ordena: true, tipo: "date" },
    { name: "Total de peças", ordena: true, tipo: "number" },
    { name: "Anotações", ordena: false, tipo: "string" },
  ];

  const rows = periodos.map((periodo) => ({
    id: periodo.id,
    cells: [
      <button
        type="button"
        className={styles.periodLink}
        onClick={() => navigate("/verMaisPeriodo", { state: { periodo } })}
      >
        {periodo.numero}
      </button>,
      periodo.dataCadastro,
      periodo.totalPecas,
      periodo.anotacoes,
    ],
  }));

  const campoBuscaAtivo = camposBusca.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.tabsSpacer} aria-hidden="true" />
        {erro && (
          <ServerResponse
            type="error"
            title="Falha ao carregar"
            message={erro}
          />
        )}

        <section className={styles.toolbar} aria-label="Ações dos períodos">
          <div className={styles.searchActions}>
            <div className={styles.menuContainer}>
              <button
                type="button"
                className={styles.optionsButton}
                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                aria-expanded={menuBuscaAberto}
                aria-controls="campos-busca-periodos"
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
                  id="campos-busca-periodos"
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
                ariaLabel="Buscar períodos"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro ariaLabel="Filtrar períodos" onClick={alternarFiltro} />

              {filtroAberto && (
                <div
                  className={`${styles.popover} ${styles.filterPopover} ${styles.filterPanel}`}
                  role="dialog"
                  aria-label="Filtros de períodos"
                >
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
              icone="adicionar"
              onClick={() => navigate("/cadastrarPeriodo")}
            >
              Adicionar
            </Button>
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

        <section className={styles.tableSection} aria-label="Lista de períodos">
          {carregando ? (
            <p>Carregando períodos...</p>
          ) : (
            <Table
              key={`${busca}-${campoBusca}-${JSON.stringify(filtros)}`}
              columns={columns}
              rows={rows}
              selecionavel={false}
            />
          )}
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

export default Periodo;