import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./EntradasESaidas.module.css";

const movimentacoesIniciais = [
    {
        id: 1,
        Tipo: "Entrada",
        Data: "01/01/2026",
        quantidade: 200,
        Contato: "Galpão A - Prateleira 4",
        NotaFiscal: "NF-94822",
        CodigoInterno: "CT-1053Y",
        Total: "R$4320,00",
        Unitario: "R$ 145,20",
    },
    {
        id: 2,
        Tipo: "Saída",
        Data: "15/02/2026",
        quantidade: 420,
        Contato: "Galpão B - Prateleira 2",
        NotaFiscal: "NF-10531",
        CodigoInterno: "CT-1053Y",
        Total: "R$8058,00",
        Unitario: "R$ 18,90",
    },
];

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
    const [movimentacoes, setMovimentacoes] = useState(movimentacoesIniciais);
    const [busca, setBusca] = useState("");
    const [campoBusca, setCampoBusca] = useState("todos");
    const [tipoFiltrado, setTipoFiltrado] = useState("todos");
    const [selecionadas, setSelecionadas] = useState([]);
    const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

    const tiposDisponiveis = useMemo(
        () => ["todos", ...new Set(movimentacoes.map((item) => item.Tipo))],
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
            <span className={`${styles.badge} ${styles[item.Tipo.toLowerCase()]}`}>
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