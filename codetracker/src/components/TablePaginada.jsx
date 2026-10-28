import styles from "./TablePaginada.module.css";
import { useEffect, useRef, useState } from "react";
import { isValidElement } from "react";

// Extrai o texto de uma célula, mesmo que ela seja um elemento React
// (ex.: <span>1.234 unidades</span> -> "1.234 unidades").
function textoDaCelula(celula) {
    if (celula === null || celula === undefined || typeof celula === "boolean") return "";
    if (typeof celula === "string" || typeof celula === "number") return String(celula);
    if (Array.isArray(celula)) return celula.map(textoDaCelula).join("");
    if (isValidElement(celula)) return textoDaCelula(celula.props.children);
    return "";
}

function formatarData(data) {
    if (!data || !data.includes("/")) return data;
    const [dia, hora] = data.trim().split(" ");
    const partes = dia.split("/");
    return `${partes[2]}-${partes[1]}-${partes[0]}${hora ? `T${hora}` : ""}`;
}

function paraNumero(valor, remover) {
    let texto = textoDaCelula(valor);

    [].concat(remover ?? []).forEach((trecho) => {
        if (trecho) texto = texto.split(trecho).join("");
    });

    texto = texto.trim();

    // Formato brasileiro: "21.780,00" -> "21780.00"
    if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
        // Milhar sem decimais: "1.234" -> "1234"
        texto = texto.replace(/\./g, "");
    }

    return parseFloat(texto) || 0;
}

// Gera a lista de páginas (0-based) com reticências: 1 … 4 5 6 … 20
function gerarPaginas(atual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const numeros = [...new Set([0, total - 1, atual - 1, atual, atual + 1])]
        .filter((n) => n >= 0 && n < total)
        .sort((a, b) => a - b);

    const resultado = [];
    numeros.forEach((n, i) => {
        if (i > 0 && n - numeros[i - 1] > 1) resultado.push(`gap-${n}`);
        resultado.push(n);
    });
    return resultado;
}

function TablePaginada(props) {
    const selecionavel = props.selecionavel ?? true;
    const paginado = props.paginado ?? true;
    const opcoesTamanho = props.opcoesItensPorPagina ?? [10, 25, 50, 100];

    // Modo servidor: ativado quando o pai informa o total de elementos.
    const modoServidor = props.totalElementos !== undefined;

    const resolverId = (row, idx) => props.rowIds?.[idx] ?? row?.id ?? idx;

    const buildLinhas = () =>
        (props.rows ?? []).map((row, idx) => ({
            id: resolverId(row, idx),
            cells: Array.isArray(row) ? row : row?.cells || [],
        }));

    const computarChave = () =>
        (props.rows ?? []).map((row, idx) => resolverId(row, idx)).join("|");

    const [ordenacaoAtiva, setOrdenacaoAtiva] = useState(null);
    const linhas = buildLinhas();
    if (ordenacaoAtiva) {
        ordenarLinhas(linhas, ordenacaoAtiva.tipo, ordenacaoAtiva.index, ordenacaoAtiva.crescente);
    }
    const [novaDirecao, setNovaDirecao] = useState(true);
    const [selecionadas, setSelecionadas] = useState([]);
    const [paginaInterna, setPaginaInterna] = useState(0);
    const [tamanhoInterno, setTamanhoInterno] = useState(
        props.itensPorPagina ?? 10,
    );
    const chaveLinhasRef = useRef(computarChave());

    useEffect(() => {
        const proximaChave = computarChave();

        if (proximaChave !== chaveLinhasRef.current) {
            setSelecionadas([]);
            if (!modoServidor) setPaginaInterna(0);

            if (props.onSelectionChange) {
                props.onSelectionChange([]);
            }

            chaveLinhasRef.current = proximaChave;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rowIds, props.rows, props.onSelectionChange]);

    // ---------- Paginação ----------
    const tamanhoPagina = modoServidor
        ? (props.itensPorPagina ?? 10)
        : tamanhoInterno;
    const totalElementos = modoServidor ? props.totalElementos : linhas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanhoPagina));
    const paginaBruta = modoServidor ? (props.paginaAtual ?? 0) : paginaInterna;
    const paginaAtual = Math.min(Math.max(paginaBruta, 0), totalPaginas - 1);

    const linhasVisiveis =
        !paginado || modoServidor
            ? linhas
            : linhas.slice(
                paginaAtual * tamanhoPagina,
                paginaAtual * tamanhoPagina + tamanhoPagina,
            );

    const inicioExibido = totalElementos === 0 ? 0 : paginaAtual * tamanhoPagina + 1;
    const fimExibido = Math.min(
        (paginaAtual + 1) * tamanhoPagina,
        totalElementos,
    );

    function irParaPagina(pagina) {
        const alvo = Math.min(Math.max(pagina, 0), totalPaginas - 1);
        if (alvo === paginaAtual) return;

        if (modoServidor) {
            props.onPageChange?.(alvo);
        } else {
            setPaginaInterna(alvo);
        }
    }

    function mudarTamanhoPagina(novoTamanho) {
        if (modoServidor) {
            props.onPageSizeChange?.(novoTamanho);
        } else {
            setTamanhoInterno(novoTamanho);
            setPaginaInterna(0);
        }
    }

    // ---------- Seleção ----------
    function notificarSelecao(proximasSelecionadas) {
        if (props.onSelectionChange) {
            props.onSelectionChange(proximasSelecionadas);
        }
    }

    // O "selecionar todos" age só nas linhas da página atual;
    // seleções de outras páginas são mantidas.
    const idsVisiveis = linhasVisiveis.map((linha) => linha.id);

    function handleSelectAll(event) {
        const proximas = event.target.checked
            ? [...new Set([...selecionadas, ...idsVisiveis])]
            : selecionadas.filter((id) => !idsVisiveis.includes(id));

        setSelecionadas(proximas);
        notificarSelecao(proximas);
    }

    function handleSelectRow(rowId) {
        const proximasSelecionadas = selecionadas.includes(rowId)
            ? selecionadas.filter((id) => id !== rowId)
            : [...selecionadas, rowId];

        setSelecionadas(proximasSelecionadas);
        notificarSelecao(proximasSelecionadas);
    }

    // ---------- Ordenação ----------
    // Ordena a lista inteira (não só a página) e volta para a primeira página.
    // No modo servidor, ordena apenas as linhas da página recebida.
    function ordenacao(column, index) {
        const tipo = column.tipo;

        // Ordenação pelo back-end: avisa o pai e ele recarrega os dados já ordenados.
        if (column.campoOrdenacao && props.onSortChange) {
            const direcao = novaDirecao ? "asc" : "desc";

            setOrdenacaoAtiva(null);
            setNovaDirecao(!novaDirecao);
            setSelecionadas([]);
            notificarSelecao([]);
            if (!modoServidor) setPaginaInterna(0);

            props.onSortChange(column.campoOrdenacao, direcao);
            return;
        }

        setOrdenacaoAtiva({ tipo, index, crescente: novaDirecao });
        setNovaDirecao(!novaDirecao);
        setSelecionadas([]);
        notificarSelecao([]);
        if (!modoServidor) setPaginaInterna(0);
    }

    function ordenarLinhas(listaOrdenada, tipo, index, crescente) {
        if (tipo === "number") {
            listaOrdenada.sort((a, b) => {
                const numA = paraNumero(a.cells[index], props.removerNaOrdenacao);
                const numB = paraNumero(b.cells[index], props.removerNaOrdenacao);
                return crescente ? numA - numB : numB - numA;
            });
        } else if (tipo === "date") {
            listaOrdenada.sort((a, b) => {
                const dataA = new Date(formatarData(textoDaCelula(a.cells[index]))).getTime() || 0;
                const dataB = new Date(formatarData(textoDaCelula(b.cells[index]))).getTime() || 0;
                return crescente ? dataA - dataB : dataB - dataA;
            });
        } else {
            listaOrdenada.sort((a, b) => {
                const strA = textoDaCelula(a.cells[index]).toLowerCase();
                const strB = textoDaCelula(b.cells[index]).toLowerCase();
                return crescente
                    ? strA.localeCompare(strB)
                    : strB.localeCompare(strA);
            });
        }

    }

    return (
        <div className={styles["table-wrapper"]}>
            {paginado && (
                <div className={styles["pagination"]}>
                    <div className={styles["pagination-info"]}>
                        <span>
                            {inicioExibido}–{fimExibido} de {totalElementos}
                        </span>

                        <label className={styles["page-size"]}>
                            Itens por página
                            <select
                                className={styles["page-size-select"]}
                                value={tamanhoPagina}
                                onChange={(e) => mudarTamanhoPagina(Number(e.target.value))}
                            >
                                {opcoesTamanho.map((opcao) => (
                                    <option key={opcao} value={opcao}>
                                        {opcao}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <nav className={styles["pagination-controls"]} aria-label="Paginação">
                        <button
                            type="button"
                            className={styles["page-button"]}
                            onClick={() => irParaPagina(0)}
                            disabled={paginaAtual === 0}
                            aria-label="Primeira página"
                        >
                            «
                        </button>
                        <button
                            type="button"
                            className={styles["page-button"]}
                            onClick={() => irParaPagina(paginaAtual - 1)}
                            disabled={paginaAtual === 0}
                            aria-label="Página anterior"
                        >
                            ‹
                        </button>

                        {gerarPaginas(paginaAtual, totalPaginas).map((pagina) =>
                            typeof pagina === "string" ? (
                                <span key={pagina} className={styles["page-ellipsis"]}>
                                    …
                                </span>
                            ) : (
                                <button
                                    key={pagina}
                                    type="button"
                                    className={`${styles["page-button"]} ${pagina === paginaAtual ? styles["page-button-active"] : ""
                                        }`}
                                    onClick={() => irParaPagina(pagina)}
                                    aria-current={pagina === paginaAtual ? "page" : undefined}
                                >
                                    {pagina + 1}
                                </button>
                            ),
                        )}

                        <button
                            type="button"
                            className={styles["page-button"]}
                            onClick={() => irParaPagina(paginaAtual + 1)}
                            disabled={paginaAtual >= totalPaginas - 1}
                            aria-label="Próxima página"
                        >
                            ›
                        </button>
                        <button
                            type="button"
                            className={styles["page-button"]}
                            onClick={() => irParaPagina(totalPaginas - 1)}
                            disabled={paginaAtual >= totalPaginas - 1}
                            aria-label="Última página"
                        >
                            »
                        </button>
                    </nav>
                </div>
            )}
            <div className={styles["table-container"]}>
                <table className={styles["custom-table"]}>
                    <thead>
                        <tr>
                            {selecionavel && (
                                <th>
                                    <input
                                        className={styles["custom-checkbox"]}
                                        type="checkbox"
                                        checked={
                                            idsVisiveis.length > 0 &&
                                            idsVisiveis.every((id) => selecionadas.includes(id))
                                        }
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            {props.columns.map((column, index) => (
                                <th
                                    key={index}
                                    style={{ cursor: column.ordena ? "pointer" : "default" }}
                                    onClick={() => column.ordena && ordenacao(column, index)}
                                >
                                    <div className={styles["th-elements"]}>
                                        {column.name}{" "}
                                        {column.ordena &&
                                            (novaDirecao ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="20px"
                                                    viewBox="0 -960 960 960"
                                                    width="20px"
                                                    fill="#000000"
                                                >
                                                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="20px"
                                                    viewBox="0 -960 960 960"
                                                    width="20px"
                                                    fill="#000000"
                                                >
                                                    <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                                                </svg>
                                            ))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linhasVisiveis.map((linha) => {
                            const isSelected = selecionadas.includes(linha.id);
                            return (
                                <tr
                                    key={linha.id}
                                    className={isSelected ? styles["selected-row"] : ""}
                                >
                                    {selecionavel && (
                                        <td>
                                            <input
                                                className={styles["custom-checkbox"]}
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(linha.id)}
                                            />
                                        </td>
                                    )}
                                    {linha.cells.map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>


        </div>
    );
}

export default TablePaginada;