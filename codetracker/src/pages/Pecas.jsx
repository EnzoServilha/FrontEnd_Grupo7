import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import styles from "./Pecas.module.css";

const camposBusca = [
  ["todos", "Todos os campos"],
  ["codigoInterno", "Código interno"],
  ["localizacao", "Localização"],
  ["marca", "Marca"],
  ["anoFabricacao", "Ano de fabricação"],
];

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
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [marcaFiltrada, setMarcaFiltrada] = useState("todas");
  const [selecionadas, setSelecionadas] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  useEffect(() => {
    const carregarPecas = async () => {
      try {
        const resposta = await api.get("/itens");
        const itens = Array.isArray(resposta.data) ? resposta.data : [];

        const itensComQuantidade = await Promise.all(
          itens.map(async (item) => {
            try {
              const respostaMovimentacao = await api.get(`/itensNaMovimentacao/item/${item.id}`);
              const ocorrencias = Array.isArray(respostaMovimentacao.data) ? respostaMovimentacao.data : [];
              const quantidade = ocorrencias.reduce((soma, ocorrencia) => {
                const qtd = Number(ocorrencia?.qtd ?? 0);
                return Number.isFinite(qtd) ? soma + qtd : soma;
              }, 0);

              return normalizarPeca(item, quantidade);
            } catch {
              return normalizarPeca(item, null);
            }
          }),
        );

        setPecas(itensComQuantidade);
      } catch (error) {
        console.error("Erro ao buscar itens:", error);
        setPecas([]);
      }
    };

    carregarPecas();
  }, []);

  const marcasDisponiveis = useMemo(
    () => ["todas", ...new Set(pecas.map((peca) => peca.marca).filter(Boolean))],
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
        String(valor ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo),
      );
    });
  }, [busca, campoBusca, marcaFiltrada, pecas]);

  const idsVisiveis = pecasFiltradas.map((peca) => peca.id);
  const todasVisiveisSelecionadas =
    idsVisiveis.length > 0 &&
    idsVisiveis.every((id) => selecionadas.includes(id));

  const alternarTodas = () => {
    setSelecionadas((idsAtuais) => {
      if (todasVisiveisSelecionadas) {
        return idsAtuais.filter((id) => !idsVisiveis.includes(id));
      }

      return [...new Set([...idsAtuais, ...idsVisiveis])];
    });
  };

  const alternarPeca = (id) => {
    setSelecionadas((idsAtuais) =>
      idsAtuais.includes(id)
        ? idsAtuais.filter((idAtual) => idAtual !== id)
        : [...idsAtuais, id],
    );
  };

  const abrirDetalhes = (peca) => {
    navigate("/verMaisPeca", { state: { peca } });
  };

  const excluirSelecionadas = () => {
    setPecas((itensAtuais) =>
      itensAtuais.filter((peca) => !selecionadas.includes(peca.id)),
    );
    setSelecionadas([]);
    setModalExcluirAberto(false);
  };

  const editarSelecionada = () => {
    const peca = pecas.find((item) => item.id === selecionadas[0]);
    if (peca) abrirDetalhes(peca);
  };

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
          <table>
            <thead>
              <tr>
                <th className={styles.checkboxColumn}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={todasVisiveisSelecionadas}
                    onChange={alternarTodas}
                    aria-label="Selecionar todas as peças visíveis"
                  />
                </th>
                <th>Código Interno</th>
                <th>Quantidade em Estoque</th>
                <th>Localização</th>
                <th>Preço Médio de Compra</th>
                <th>Preço Médio de Venda</th>
                <th>Marca</th>
                <th>Data de Cadastro</th>
                <th>Ano de Fabricação</th>
              </tr>
            </thead>
            <tbody>
              {pecasFiltradas.map((peca) => {
                const selecionada = selecionadas.includes(peca.id);
                const rotuloCodigos =
                  peca.codigosAssociados === 0
                    ? "Nenhum código associado vinculado"
                    : peca.codigosAssociados === 1
                      ? "1 Código associado vinculado"
                      : `${peca.codigosAssociados} Códigos associados vinculados`;

                return (
                  <tr
                    key={peca.id}
                    className={selecionada ? styles.selectedRow : ""}
                    onClick={() => abrirDetalhes(peca)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        abrirDetalhes(peca);
                      }
                    }}
                    tabIndex="0"
                  >
                    <td>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selecionada}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => alternarPeca(peca.id)}
                        aria-label={`Selecionar peça ${peca.codigoInterno}`}
                      />
                    </td>
                    <td>
                      <strong>{peca.codigoInterno}</strong>
                      <span className={styles.associatedCodes}>
                        {rotuloCodigos}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stockBadge}>
                        {peca.quantidade === "---"
                          ? "---"
                          : `${Number(peca.quantidade).toLocaleString("pt-BR")} unidades`}
                      </span>
                    </td>
                    <td>{peca.localizacao}</td>
                    <td>{peca.precoCompra}</td>
                    <td>{peca.precoVenda}</td>
                    <td className={styles.brand}>{peca.marca}</td>
                    <td>{peca.dataCadastro}</td>
                    <td>{peca.anoFabricacao}</td>
                  </tr>
                );
              })}

              {pecasFiltradas.length === 0 && (
                <tr>
                  <td className={styles.emptyState} colSpan="9">
                    Nenhuma peça encontrada.
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
        onConfirm={excluirSelecionadas}
      />
    </div>
  );
}

export default Pecas;