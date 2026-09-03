import { useMemo, useState } from "react";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import styles from "./Periodo.module.css";

const periodosIniciais = [
  {
    id: 3,
    numero: "03",
    dataCadastro: "01/04/2026",
    totalPecas: 10,
    anotacoes: "Inventário mensal de abril",
  },
  {
    id: 2,
    numero: "02",
    dataCadastro: "01/03/2026",
    totalPecas: 42,
    anotacoes: "Inventário mensal de março",
  },
  {
    id: 1,
    numero: "01",
    dataCadastro: "01/04/2025",
    totalPecas: 150,
    anotacoes: "Inventário anual",
  },
];

const camposBusca = [
  ["todos", "Todos os campos"],
  ["numero", "Número"],
  ["dataCadastro", "Data de cadastro"],
  ["totalPecas", "Total de peças"],
  ["anotacoes", "Anotações"],
];

function dataAtualParaInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Periodo() {
  const [periodos, setPeriodos] = useState(periodosIniciais);
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
    dataCadastro: dataAtualParaInput(),
    totalPecas: "",
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

  const idsVisiveis = periodosFiltrados.map((periodo) => periodo.id);
  const todosVisiveisSelecionados =
    idsVisiveis.length > 0 &&
    idsVisiveis.every((id) => selecionados.includes(id));

  const alternarTodos = () => {
    setSelecionados((idsAtuais) => {
      if (todosVisiveisSelecionados) {
        return idsAtuais.filter((id) => !idsVisiveis.includes(id));
      }

      return [...new Set([...idsAtuais, ...idsVisiveis])];
    });
  };

  const alternarPeriodo = (id) => {
    setSelecionados((idsAtuais) =>
      idsAtuais.includes(id)
        ? idsAtuais.filter((idAtual) => idAtual !== id)
        : [...idsAtuais, id],
    );
  };

  const excluirSelecionados = () => {
    setPeriodos((itensAtuais) =>
      itensAtuais.filter((periodo) => !selecionados.includes(periodo.id)),
    );
    setSelecionados([]);
  };

  const adicionarPeriodo = (event) => {
    event.preventDefault();

    const maiorNumero = periodos.reduce(
      (maior, periodo) => Math.max(maior, Number(periodo.numero)),
      0,
    );

    setPeriodos((itensAtuais) => [
      {
        id: Date.now(),
        numero: String(maiorNumero + 1).padStart(2, "0"),
        dataCadastro: formatarData(novoPeriodo.dataCadastro),
        totalPecas: Number(novoPeriodo.totalPecas) || 0,
        anotacoes: novoPeriodo.anotacoes || "Sem anotações",
      },
      ...itensAtuais,
    ]);

    setNovoPeriodo({
      dataCadastro: dataAtualParaInput(),
      totalPecas: "",
      anotacoes: "",
    });
    setModalAdicionarAberto(false);
  };

  const campoBuscaAtivo = camposBusca.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
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

        <section className={styles.tableSection} aria-label="Lista de períodos">
          <table>
            <thead>
              <tr>
                <th className={styles.checkboxColumn}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={todosVisiveisSelecionados}
                    onChange={alternarTodos}
                    aria-label="Selecionar todos os períodos visíveis"
                  />
                </th>
                <th>Número</th>
                <th>Data cadastro</th>
                <th>Total de peças</th>
                <th>Anotações</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {periodosFiltrados.map((periodo) => {
                const selecionado = selecionados.includes(periodo.id);

                return (
                  <tr
                    key={periodo.id}
                    className={selecionado ? styles.selectedRow : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selecionado}
                        onChange={() => alternarPeriodo(periodo.id)}
                        aria-label={`Selecionar período ${periodo.numero}`}
                      />
                    </td>
                    <td className={styles.periodNumber}>{periodo.numero}</td>
                    <td>{periodo.dataCadastro}</td>
                    <td>{periodo.totalPecas}</td>
                    <td>
                      <span
                        className={styles.annotationBar}
                        title={periodo.anotacoes}
                      />
                    </td>
                    <td className={styles.consultColumn}>
                      <button
                        type="button"
                        className={styles.consultButton}
                        onClick={() => setPeriodoConsultado(periodo)}
                      >
                        Consultar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {periodosFiltrados.length === 0 && (
                <tr>
                  <td className={styles.emptyState} colSpan="6">
                    Nenhum período encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

            <label htmlFor="data-periodo">
              Data de cadastro
              <input
                id="data-periodo"
                type="date"
                required
                value={novoPeriodo.dataCadastro}
                onChange={(event) =>
                  setNovoPeriodo((dadosAtuais) => ({
                    ...dadosAtuais,
                    dataCadastro: event.target.value,
                  }))
                }
              />
            </label>

            <label htmlFor="total-pecas-periodo">
              Total de peças
              <input
                id="total-pecas-periodo"
                type="number"
                min="0"
                required
                value={novoPeriodo.totalPecas}
                onChange={(event) =>
                  setNovoPeriodo((dadosAtuais) => ({
                    ...dadosAtuais,
                    totalPecas: event.target.value,
                  }))
                }
                placeholder="Digite o total de peças"
              />
            </label>

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
