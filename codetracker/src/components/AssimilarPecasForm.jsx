import { useEffect, useState } from "react";
import { api } from "../provider/api";
import Button from "./Button";
import styles from "./AssociacaoForm.module.css";

// Aceita array, Page do Spring ({ content }), DTO de cliente ({ conteudo })
// ou corpo vazio (resposta 204, em que data chega como "").
const extrairLista = (dados) =>
    Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.content)
            ? dados.content
            : Array.isArray(dados?.conteudo)
                ? dados.conteudo
                : [];

/**
 * Busca de peças + lista das peças a assimilar.
 *
 * itens:        [{ id, codigo }]
 * idsExcluidos: ids que não devem ser oferecidos (a própria peça, já similares...)
 * onAdicionar:  (peca) => void   (peca = item do back, com id e codigoInterno)
 * onRemover:    (id) => void
 */
function AssimilarPecasForm({ itens = [], idsExcluidos = [], onAdicionar, onRemover }) {
    const [busca, setBusca] = useState("");
    const [resultados, setResultados] = useState([]);
    const [erro, setErro] = useState("");

    const disponivel = (peca) => !idsExcluidos.includes(peca.id);
    const sugestoes = resultados.filter(disponivel).slice(0, 8);

    useEffect(() => {
        const termo = busca.trim();

        if (termo.length < 2) {
            setResultados([]);
            return undefined;
        }

        let cancelado = false;

        const buscarPecas = async () => {
            try {
                const resposta = await api.get("/itens/pesquisar", { params: { termo } });
                if (!cancelado) {
                    setResultados(extrairLista(resposta.data));
                    setErro("");
                }
            } catch (error) {
                console.error("Erro ao buscar peças:", error);
                if (!cancelado) {
                    setResultados([]);
                    setErro(
                        error?.response?.data?.message || "Não foi possível buscar as peças.",
                    );
                }
            }
        };

        const timer = setTimeout(buscarPecas, 250);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [busca]);

    const incluir = (peca) => {
        onAdicionar?.(peca);
        setBusca("");
        setResultados([]);
        setErro("");
    };

    const adicionar = async () => {
        const termo = busca.trim();
        if (!termo) return;

        setErro("");

        try {
            const resposta = await api.get("/itens/pesquisar", { params: { termo } });
            const disponiveis = extrairLista(resposta.data).filter(disponivel);

            if (disponiveis.length === 0) {
                setErro("Nenhuma peça disponível encontrada para esse termo.");
                return;
            }

            const escolhida =
                disponiveis.find(
                    (peca) => peca.codigoInterno?.toLowerCase() === termo.toLowerCase(),
                ) || disponiveis[0];

            incluir(escolhida);
        } catch (error) {
            console.error("Erro ao buscar peça para assimilar:", error);
            setErro(
                error?.response?.data?.message || "Não foi possível procurar a peça informada.",
            );
        }
    };

    return (
        <div className={styles.similarityContent}>
            <label htmlFor="buscar-peca">Pesquisar por peça:</label>

            <div className={styles.searchRow}>
                <div className={styles.searchField}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                    </svg>
                    <input
                        id="buscar-peca"
                        name="buscarPeca"
                        type="text"
                        autoComplete="off"
                        value={busca}
                        placeholder="Digite a peça a assimilar"
                        onChange={(event) => setBusca(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                adicionar();
                            }
                        }}
                    />
                </div>

                <div className={styles.addButton}>
                    <Button type="button" estilo="editar" onClick={adicionar}>
                        Adicionar
                    </Button>
                </div>
            </div>

            {sugestoes.length > 0 && (
                <div className={styles.suggestionDropdown} role="listbox" aria-label="Peças sugeridas">
                    {sugestoes.map((peca) => (
                        <button
                            key={peca.id}
                            type="button"
                            className={styles.suggestionOption}
                            onClick={() => incluir(peca)}
                        >
                            <span className={styles.suggestionCode}>{peca.codigoInterno}</span>
                            <span className={styles.suggestionMeta}>{peca.marca || "Sem marca"}</span>
                        </button>
                    ))}
                </div>
            )}

            {erro && <p className={styles.erro}>{erro}</p>}

            <div className={styles.itemsList}>
                {itens.map((item) => (
                    <div className={styles.partItem} key={item.id}>
                        <button
                            type="button"
                            aria-label={`Remover peça ${item.codigo}`}
                            onClick={() => onRemover?.(item.id)}
                        >
                            X
                        </button>
                        <span>{item.codigo}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AssimilarPecasForm;