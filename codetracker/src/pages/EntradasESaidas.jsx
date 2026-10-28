import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import TablePaginada from "../components/TablePaginada";
import styles from "./EntradasESaidas.module.css";

const ITENS_POR_PAGINA = 10;
const OPCOES_ITENS_POR_PAGINA = [10, 25, 50, 100];
const ATRASO_BUSCA_MS = 400;

const camposBusca = [
    ["codigo", "Código interno/associado"],
    ["contato", "Contato"],

];

const FILTROS_VAZIOS = {
    tipo: "", // "" | "ENTRADA" | "SAIDA"
    dataModo: "qualquer", // "qualquer" | "especifica" | "periodo"
    dataInicial: "",
    dataFinal: "",
};

const formatarTipo = (tipo) => {
    if (tipo === "ENTRADA") return "Entrada";
    if (tipo === "SAIDA") return "Saída";
    return tipo || "---";
};

const filtrosAtivos = (f) => f.tipo !== "" || f.dataModo !== "qualquer";

const filtrosValidos = (f) =>
    f.dataModo === "qualquer" ||
    (f.dataModo === "especifica" && Boolean(f.dataInicial)) ||
    (f.dataModo === "periodo" &&
        Boolean(f.dataInicial) &&
        Boolean(f.dataFinal) &&
        f.dataInicial <= f.dataFinal);

const isoParaBr = (iso) => iso.split("-").reverse().join("/");

const resumoFiltros = (f) => {
    const partes = [];
    if (f.tipo) partes.push(`Tipo: ${formatarTipo(f.tipo)}`);
    if (f.dataModo === "especifica") partes.push(`Data: ${isoParaBr(f.dataInicial)}`);
    if (f.dataModo === "periodo") {
        partes.push(`Data: de ${isoParaBr(f.dataInicial)} a ${isoParaBr(f.dataFinal)}`);
    }
    return partes.join(" · ");
};

const doisDigitos = (numero) => String(numero).padStart(2, "0");

// Separa o texto exibido ("dd/mm/aaaa" ou "dd/mm/aaaa hh:mm") do dia em ISO,
// que é usado no filtro. Lê a string direto para não perder um dia por fuso.
const interpretarDataHora = (valor) => {
    if (!valor) return { iso: "", texto: "---" };

    const encontrado = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (encontrado) {
        const [, ano, mes, dia, hora, minuto] = encontrado;
        return {
            iso: `${ano}-${mes}-${dia}`,
            texto: `${dia}/${mes}/${ano}${hora ? ` ${hora}:${minuto}` : ""}`,
        };
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return { iso: "", texto: String(valor) };

    return {
        iso: `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`,
        texto: data.toLocaleDateString("pt-BR"),
    };
};

const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
        return "---";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor));
};

const normalizarMovimentacao = (registro) => {
    const movimentacao = registro?.movimentacaoEstoque ?? {};
    const item = registro?.item ?? {};
    const tipo = String(movimentacao?.tipo?.nome ?? "").trim();

    const quantidade = Number(registro?.qtd ?? 0);

    // Preço da linha: unitário do item × quantidade.
    // (movimentacao.valorTotal e precoProdutos somam a movimentação inteira.)
    const unitario =
        registro?.precoUnitario === null || registro?.precoUnitario === undefined
            ? null
            : Number(registro.precoUnitario);
    const unitarioValido = Number.isFinite(unitario);
    const total = unitarioValido ? quantidade * unitario : null;

    const contato =
        movimentacao?.fornecedor?.nomeEmpresa ||
        movimentacao?.fornecedor?.nomeContato ||
        movimentacao?.cliente?.nome ||
        movimentacao?.cliente?.nomeContato ||
        "Sem contato";

    const dataHora = interpretarDataHora(
        movimentacao?.dataMovimentacao ?? movimentacao?.dataEntrega ?? movimentacao?.dataEntregaPrevista,
    );

    return {
        id: registro?.id ?? null,
        Tipo: formatarTipo(tipo),
        Data: dataHora.texto,
        dataISO: dataHora.iso,
        quantidade,
        Contato: contato,
        NotaFiscal: movimentacao?.numeroNotaFiscal || "---",
        CodigoInterno: item?.codigoInterno || "---",
        Total: formatarMoeda(total),
        Unitario: formatarMoeda(unitarioValido ? unitario : null),
        _tipoOriginal: tipo,
    };
};

const extrairLista = (resposta) => (Array.isArray(resposta.data) ? resposta.data : []);

async function buscarRegistros({ termo, campoBusca, tipo, periodoIdRef }) {
    // Sem pesquisa e sem tipo: itens das movimentações do período atual
    if (!termo && !tipo) {
        if (!periodoIdRef.current) {
            const respostaPeriodo = await api.get("/periodos/ultimo");
            periodoIdRef.current = respostaPeriodo?.data?.id ?? null;
        }
        if (!periodoIdRef.current) return [];

        return extrairLista(
            await api.get(`/itensNaMovimentacao/item/periodo/${periodoIdRef.current}`),
        );
    }

    const params = {};
    if (tipo) params.tipo = tipo;
    if (termo) params[campoBusca] = termo; // "contato" ou "codigo"

    return extrairLista(await api.get("/itensNaMovimentacao/buscar", { params }));
}

function EntradasESaidas() {
    const navigate = useNavigate();
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [busca, setBusca] = useState("");
    const [buscaAplicada, setBuscaAplicada] = useState("");
    const [campoBusca, setCampoBusca] = useState("codigo");
    const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
    const [rascunhoFiltros, setRascunhoFiltros] = useState(FILTROS_VAZIOS);
    const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const periodoIdRef = useRef(null);

    const termoBusca = buscaAplicada.trim();
    // Sem termo, o campo de busca não muda a consulta
    const campoConsulta = termoBusca ? campoBusca : "contato";

    // Espera o usuário parar de digitar antes de consultar o back
    useEffect(() => {
        const temporizador = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA_MS);
        return () => clearTimeout(temporizador);
    }, [busca]);

    // Só termo, campo e tipo vão ao back. A data é filtrada no front (abaixo),
    // então mudar a data não dispara nova requisição.
    useEffect(() => {
        let cancelado = false;

        const carregarMovimentacoes = async () => {
            try {
                setCarregando(true);

                const lista = await buscarRegistros({
                    termo: termoBusca,
                    campoBusca: campoConsulta,
                    tipo: filtros.tipo,
                    periodoIdRef,
                });

                // Ignora respostas antigas se a consulta mudou no meio do caminho
                if (!cancelado) setMovimentacoes(lista.map(normalizarMovimentacao));
            } catch (error) {
                console.error("Erro ao buscar entradas e saídas:", error);
                if (!cancelado) setMovimentacoes([]);
            } finally {
                if (!cancelado) setCarregando(false);
            }
        };

        carregarMovimentacoes();

        return () => {
            cancelado = true;
        };
    }, [termoBusca, campoConsulta, filtros.tipo]);

    // Filtro de data e hora: por um dia ou entre dois dias (inclusive)
    const dadosFiltrados = useMemo(() => {
        if (filtros.dataModo === "qualquer") return movimentacoes;

        const inicial = filtros.dataInicial;
        const final = filtros.dataModo === "especifica" ? filtros.dataInicial : filtros.dataFinal;

        return movimentacoes.filter(
            (item) => item.dataISO && item.dataISO >= inicial && item.dataISO <= final,
        );
    }, [movimentacoes, filtros]);

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
        setFiltroAberto(false);
    };

    const limparFiltros = () => {
        setFiltros(FILTROS_VAZIOS);
        setRascunhoFiltros(FILTROS_VAZIOS);
        setFiltroAberto(false);
    };

    const columns = [
        { name: "Tipo", ordena: false, tipo: "string" },
        { name: "Data e Hora", ordena: true, tipo: "date" },
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

                <section className={styles.toolbar} aria-label="Pesquisa de entradas e saídas">
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
                                campo={campoBuscaAtivo}
                                placeholder="Digite para buscar..."
                                value={busca}
                                onChange={(event) => setBusca(event.target.value)}
                                ariaLabel="Buscar em entradas e saídas"
                            />
                        </div>

                        <div className={styles.menuContainer}>
                            <Filtro ariaLabel="Filtrar entradas e saídas" onClick={alternarFiltro} />

                            {filtroAberto && (
                                <div
                                    className={`${styles.popover} ${styles.filterPopover} ${styles.filterPanel}`}
                                    role="dialog"
                                    aria-label="Filtros de entradas e saídas"
                                >
                                    <fieldset className={styles.filterGroup}>
                                        <legend>Tipo</legend>
                                        <select
                                            value={rascunhoFiltros.tipo}
                                            onChange={(event) =>
                                                atualizarRascunho({ tipo: event.target.value })
                                            }
                                        >
                                            <option value="">Entrada e saída</option>
                                            <option value="ENTRADA">Entrada</option>
                                            <option value="SAIDA">Saída</option>
                                        </select>
                                    </fieldset>

                                    <fieldset className={styles.filterGroup}>
                                        <legend>Data e hora</legend>
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
                                                            : "Data"
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

                                        <span className={styles.filterHint}>
                                            Filtra pelo dia do registro.
                                        </span>
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
                </section>

                {filtrosAtivos(filtros) && (
                    <div className={styles.activeFilters}>
                        <span>{resumoFiltros(filtros)}</span>
                        <button type="button" onClick={limparFiltros}>
                            Limpar filtros
                        </button>
                    </div>
                )}

                <section className={styles.tableSection} aria-label="Entradas e saídas">
                    <TablePaginada
                        columns={columns}
                        rows={rows}
                        selecionavel={false}
                        removerNaOrdenacao="R$"
                        itensPorPagina={ITENS_POR_PAGINA}
                        opcoesItensPorPagina={OPCOES_ITENS_POR_PAGINA}
                    />

                    {carregando && (
                        <p className={styles.tableMessage}>Carregando entradas e saídas...</p>
                    )}
                    {!carregando && rows.length === 0 && (
                        <p className={styles.tableMessage}>Nenhum registro encontrado.</p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default EntradasESaidas;