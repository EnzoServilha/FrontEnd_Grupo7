import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
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

  console.log("rows:", rows);
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