import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./EntradasESaidas.module.css";

// PONTOS A REVISAR

/**
 * Pelo comportamento, o campo de preço total esta juntando a soma de todos os produtos da movimentação
 */

const formatarData = (valor) => {
    if (!valor) return "---";

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return String(valor);

    return data.toLocaleDateString("pt-BR");
};

const formatarMoeda = (valor) => {
    const numero = Number(valor ?? 0);
    if (Number.isNaN(numero)) return "---";

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numero);
};

const normalizarMovimentacao = (registro) => {
    const movimentacao = registro?.movimentacaoEstoque ?? {};
    const item = registro?.item ?? {};
    const tipo = String(movimentacao?.tipo?.nome ?? "").trim();
    const tipoFormatado = tipo === "ENTRADA" ? "Entrada" : tipo === "SAIDA" ? "Saída" : "---";

    const quantidade = Number(registro?.qtd ?? 0);
    const unitario = Number(registro?.precoUnitario ?? movimentacao?.precoProdutos ?? 0);
    const total = Number(movimentacao?.valorTotal ?? quantidade * unitario ?? 0);

    const contato =
        movimentacao?.fornecedor?.nomeEmpresa ||
        movimentacao?.fornecedor?.nomeContato ||
        movimentacao?.cliente?.nome ||
        movimentacao?.cliente?.nomeContato ||
        "Sem contato";

    return {
        id: registro?.id ?? null,
        Tipo: tipoFormatado,
        Data: formatarData(movimentacao?.dataMovimentacao ?? movimentacao?.dataEntrega ?? movimentacao?.dataEntregaPrevista),
        quantidade,
        Contato: contato,
        NotaFiscal: movimentacao?.numeroNotaFiscal || "---",
        CodigoInterno: item?.codigoInterno || "---",
        Total: formatarMoeda(total),
        Unitario: formatarMoeda(unitario),
        _tipoOriginal: tipo,
    };
};

const camposBusca = [
    ["todos", "Todos os campos"],
    ["Tipo", "Tipo"],
    ["Data", "Data"],
    ["Contato", "Contato"],
    ["NotaFiscal", "Nº Nota Fiscal"],
    ["CodigoInterno", "Código Interno"],
];

function EntradasESaidas() {
    const navigate = useNavigate();
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [busca, setBusca] = useState("");
    const [campoBusca, setCampoBusca] = useState("todos");
    const [tipoFiltrado, setTipoFiltrado] = useState("todos");
    const [selecionadas, setSelecionadas] = useState([]);
    const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

    useEffect(() => {
        const carregarMovimentacoes = async () => {
            try {
                const respostaPeriodo = await api.get("/periodos/ultimo");
                const periodoAtual = respostaPeriodo?.data ?? null;

                if (!periodoAtual?.id) {
                    setMovimentacoes([]);
                    return;
                }

                const respostaItens = await api.get(`/itensNaMovimentacao/item/periodo/${periodoAtual.id}`);
                const lista = Array.isArray(respostaItens.data) ? respostaItens.data : [];

                setMovimentacoes(lista.map(normalizarMovimentacao));
            } catch (error) {
                console.error("Erro ao buscar movimentações do período atual:", error);
                setMovimentacoes([]);
            }
        };

        carregarMovimentacoes();
    }, []);

    const tiposDisponiveis = useMemo(
        () => ["todos", ...new Set(movimentacoes.map((item) => item.Tipo).filter(Boolean))],
        [movimentacoes],
    );

    const dadosFiltrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");

        return movimentacoes.filter((item) => {
            if (tipoFiltrado !== "todos" && item.Tipo !== tipoFiltrado) {
                return false;
            }

            if (!termo) return true;

            const valores =
                campoBusca === "todos"
                    ? [item.Tipo, item.Data, item.Contato, item.NotaFiscal, item.CodigoInterno]
                    : [item[campoBusca]];

            return valores.some((valor) =>
                String(valor).toLocaleLowerCase("pt-BR").includes(termo),
            );
        });
    }, [busca, campoBusca, tipoFiltrado, movimentacoes]);

    const excluirSelecionadas = () => {
        setMovimentacoes((itensAtuais) =>
            itensAtuais.filter((item) => !selecionadas.includes(item.id)),
        );
        setSelecionadas([]);
    };

    const columns = [
        { name: "Tipo", ordena: false, tipo: "string" },
        { name: "Data", ordena: true, tipo: "date" },
        { name: "Quantidade", ordena: true, tipo: "number" },
        { name: "Contato", ordena: true, tipo: "string" },
        { name: "Nº Nota Fiscal", ordena: true, tipo: "string" },
        { name: "Código Interno", ordena: false, tipo: "string" },
        { name: "Preço Total", ordena: true, tipo: "number" },
        { name: "Preço Unitário", ordena: true, tipo: "number" },
    ];

    const rows = dadosFiltrados.map((item) => ({
        id: item.id,
        cells: [
            <span className={`${styles.badge} ${styles[(item._tipoOriginal || item.Tipo).toLowerCase()]}`}>
                {item.Tipo}
            </span>,
            item.Data,
            item.quantidade.toLocaleString("pt-BR"),
            item.Contato,
            <button className={styles.nfBadge} type="button">
                {item.NotaFiscal}
            </button>,
            <span className={styles.boldText}>{item.CodigoInterno}</span>,
            item.Total,
            item.Unitario,
        ],
    }));

    const campoBuscaAtivo = camposBusca.find(([valor]) => valor === campoBusca)?.[1];

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.content}>
                <div className={styles.tabs} role="tablist" aria-label="Visões de peças">
                    <button
                        type="button"
                        role="tab"
                        aria-selected="false"
                        onClick={() => navigate("/pecas")}
                    >
                        Catálogo de Peças
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected="true"
                        className={styles.activeTab}
                        onClick={() => navigate("/entradasESaidas")}
                    >
                        Entradas e Saídas
                    </button>
                </div>

                <section className={styles.toolbar} aria-label="Ações de entradas e saídas">
                    <div className={styles.searchActions}>
                        <div className={styles.menuContainer}>
                            <button
                                type="button"
                                className={styles.optionsButton}
                                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                                aria-expanded={menuBuscaAberto}
                                aria-controls="campos-busca-entradas"
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
                                <div id="campos-busca-entradas" className={styles.popover} role="menu">
                                    {camposBusca.map(([valor, label]) => (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            key={valor}
                                            className={campoBusca === valor ? styles.selectedOption : ""}
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
                                ariaLabel="Buscar em entradas e saídas"
                            />
                        </div>

                        <div className={styles.menuContainer}>
                            <Filtro
                                ariaLabel="Filtrar por tipo"
                                onClick={() => {
                                    setFiltroAberto((aberto) => !aberto);
                                    setMenuBuscaAberto(false);
                                }}
                            />

                            {filtroAberto && (
                                <div className={`${styles.popover} ${styles.filterPopover}`} role="menu">
                                    {tiposDisponiveis.map((tipo) => (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            key={tipo}
                                            className={tipoFiltrado === tipo ? styles.selectedOption : ""}
                                            onClick={() => {
                                                setTipoFiltrado(tipo);
                                                setFiltroAberto(false);
                                                setSelecionadas([]);
                                            }}
                                        >
                                            {tipo === "todos" ? "Todos os tipos" : tipo}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </section>

                <section className={styles.tableSection} aria-label="Entradas e saídas">
                    <Table
                        key={`${busca}-${campoBusca}-${tipoFiltrado}`}
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

export default EntradasESaidas;