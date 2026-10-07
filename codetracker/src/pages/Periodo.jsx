import { useCallback, useEffect, useMemo, useState } from "react";
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

// "2026-10-07T15:12:42" -> "07/10/2026" (sem new Date, para não deslocar por fuso)
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

const camposBusca = [
  ["todos", "Todos os campos"],
  ["numero", "Número"],
  ["dataCadastro", "Data de cadastro"],
  ["totalPecas", "Total de peças"],
  ["anotacoes", "Anotações"],
];


function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Periodo() {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroAdicionar, setErroAdicionar] = useState("");

  const carregarPeriodos = useCallback(async () => {
    setErro("");
    try {
      const resposta = await api.get("/periodos");
      const lista = Array.isArray(resposta.data) ? resposta.data : [];
      setPeriodos(lista.map(mapearPeriodo));
    } catch (error) {
      console.error("Erro ao buscar períodos:", error);
      setErro("Não foi possível carregar os períodos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPeriodos();
  }, [carregarPeriodos]);
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [anoFiltrado, setAnoFiltrado] = useState("todos");
  const [selecionados, setSelecionados] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [periodoConsultado, setPeriodoConsultado] = useState(null);
  const [novoPeriodo, setNovoPeriodo] = useState({
    anotacoes: "",
  });

  const anosDisponiveis = useMemo(
    () => [
      "todos",
      ...new Set(periodos.map((periodo) => periodo.dataCadastro.slice(-4))),
    ],
    [periodos],
  );

  const periodosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return periodos.filter((periodo) => {
      if (
        anoFiltrado !== "todos" &&
        !periodo.dataCadastro.endsWith(anoFiltrado)
      ) {
        return false;
      }

      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? [
            periodo.numero,
            periodo.dataCadastro,
            periodo.totalPecas,
            periodo.anotacoes,
          ]
          : [periodo[campoBusca]];

      return valores.some((valor) =>
        String(valor).toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [anoFiltrado, busca, campoBusca, periodos]);

  const excluirSelecionados = () => {
    setPeriodos((itensAtuais) =>
      itensAtuais.filter((periodo) => !selecionados.includes(periodo.id)),
    );
    setSelecionados([]);
  };

  const adicionarPeriodo = async (event) => {
    event.preventDefault();
    setErroAdicionar("");

    try {
      await api.post("/periodos", {
        anotacao: novoPeriodo.anotacoes,
        qtdPecas: Number(novoPeriodo.totalPecas) || 0,
        dataCriacao: `${novoPeriodo.dataCadastro}T00:00:00`,
      });

      await carregarPeriodos();

      setNovoPeriodo({
        anotacoes: "",
      });
      setModalAdicionarAberto(false);
    } catch (error) {
      console.error("Erro ao adicionar período:", error);
      setErroAdicionar(
        error?.response?.data?.message ||
        "Não foi possível adicionar o período.",
      );
    }
  };


  const columns = [
    { name: "Número", ordena: false, tipo: "string" },
    { name: "Data cadastro", ordena: true, tipo: "date" },
    { name: "Total de peças", ordena: true, tipo: "number" },
    { name: "Anotações", ordena: false, tipo: "string" },
  ];

  const rows = periodosFiltrados.map((periodo) => ({
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
                placeholder="Buscar período..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar períodos"
              />
            </div>

            <div className={styles.menuContainer}>
              <Filtro
                ariaLabel="Filtrar períodos por ano"
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
                  {anosDisponiveis.map((ano) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={ano}
                      className={
                        anoFiltrado === ano ? styles.selectedOption : ""
                      }
                      onClick={() => {
                        setAnoFiltrado(ano);
                        setFiltroAberto(false);
                        setSelecionados([]);
                      }}
                    >
                      {ano === "todos" ? "Todos os anos" : ano}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              icone="adicionar"
              onClick={() => setModalAdicionarAberto(true)}
            >
              Adicionar
            </Button>
          </div>
        </section>

        <section className={styles.tableSection} aria-label="Lista de períodos">
          {carregando ? (
            <p>Carregando períodos...</p>
          ) : (
            <Table
              key={`${busca}-${campoBusca}-${anoFiltrado}`}
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

      {modalAdicionarAberto && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() => setModalAdicionarAberto(false)}
        >
          <form
            className={styles.modalCard}
            onSubmit={adicionarPeriodo}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2>Adicionar Período</h2>

            <label htmlFor="anotacoes-periodo">
              Anotações
              <textarea
                id="anotacoes-periodo"
                value={novoPeriodo.anotacoes}
                onChange={(event) =>
                  setNovoPeriodo((dadosAtuais) => ({
                    ...dadosAtuais,
                    anotacoes: event.target.value,
                  }))
                }
                placeholder="Digite as anotações do período"
              />
            </label>
            {erroAdicionar && (
              <ServerResponse
                type="error"
                title="Falha ao adicionar"
                message={erroAdicionar}
              />
            )}

            <div className={styles.modalActions}>
              <Button
                type="button"
                estilo="editar"
                onClick={() => setModalAdicionarAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </div>
      )}

      {periodoConsultado && (
        <div
          className={styles.modalOverlay}
          onMouseDown={() => setPeriodoConsultado(null)}
        >
          <section
            className={`${styles.modalCard} ${styles.detailsCard}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-periodo-consultado"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="titulo-periodo-consultado">
              Período {periodoConsultado.numero}
            </h2>
            <dl>
              <div>
                <dt>Data de cadastro</dt>
                <dd>{periodoConsultado.dataCadastro}</dd>
              </div>
              <div>
                <dt>Total de peças</dt>
                <dd>{periodoConsultado.totalPecas}</dd>
              </div>
              <div>
                <dt>Anotações</dt>
                <dd>{periodoConsultado.anotacoes}</dd>
              </div>
            </dl>
            <div className={styles.modalActions}>
              <Button onClick={() => setPeriodoConsultado(null)}>Fechar</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Periodo;
