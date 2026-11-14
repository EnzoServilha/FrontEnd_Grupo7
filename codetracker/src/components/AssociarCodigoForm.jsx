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

export const montarPayloadCodigo = (codigo, contato) =>
    contato.tipo === "Cliente"
        ? { codigo, clienteId: contato.id }
        : { codigo, fornecedorId: contato.id };

const normalizarContato = (contato, tipo) => {
    if (!contato || typeof contato !== "object") return null;

    const tipoEntidade = String(contato.tipoEntidade || "").toUpperCase();
    const tipoFinal =
        tipoEntidade === "CLIENTE"
            ? "Cliente"
            : tipoEntidade === "FORNECEDOR"
                ? "Fornecedor"
                : tipo === "cliente"
                    ? "Cliente"
                    : "Fornecedor";

    const nomeEmpresa =
        contato.nomeEmpresa || contato.nome || contato.razaoSocial || contato.empresa || "";
    const nomeContato = contato.nomeContato || contato.contato || "";

    const empresaValida = nomeEmpresa.trim();
    const contatoValido = nomeContato.trim();

    if (!contato.id && !empresaValida && !contatoValido) return null;

    const nomeEmpresaFinal = empresaValida || tipoFinal;
    const nomeContatoFinal = contatoValido || "Sem contato";

    return {
        id: contato.id,
        tipo: tipoFinal,
        nomeEmpresa: nomeEmpresaFinal,
        nomeContato: nomeContatoFinal,
        label: `${nomeEmpresaFinal} • ${nomeContatoFinal}`,
    };
};

// Uma busca que falha não derruba as outras
const buscarLista = (url, params) =>
    api
        .get(url, { params })
        .then((resposta) => extrairLista(resposta.data))
        .catch((error) => {
            console.error(`Erro ao buscar em ${url}:`, error);
            return [];
        });

/**
 * Busca de cliente/fornecedor + código + lista dos códigos adicionados.
 *
 * itens:            [{ id, codigo, contato }]  (contato = texto já formatado)
 * onAdicionar:      ({ codigo, contato }) => texto de erro | undefined (pode ser async)
 * onRemover:        (id) => void
 * onCadastrarContato: ("cliente" | "fornecedor") => void
 * modoEdicao:       esconde a lista e o botão Adicionar; informe o que o usuário
 *                   digitou/selecionou por onEstadoChange({ codigo, contato })
 */
function AssociarCodigoForm({
    itens = [],
    modoEdicao = false,
    contatoInicial = null,
    codigoInicial = "",
    onAdicionar,
    onRemover,
    onCadastrarContato,
    onEstadoChange,
}) {
    const [busca, setBusca] = useState(contatoInicial?.label ?? "");
    const [sugestoes, setSugestoes] = useState([]);
    const [contato, setContato] = useState(contatoInicial);
    const [codigo, setCodigo] = useState(codigoInicial);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const termo = busca.trim();

        // Contato já escolhido: não precisa sugerir de novo
        if (contato || termo.length < 2) {
            setSugestoes([]);
            return undefined;
        }

        let cancelado = false;

        const buscarContatos = async () => {
            // Procura pelo nome do contato e pelo nome da empresa
            const [cContato, cEmpresa, fContato, fEmpresa] = await Promise.all([
                buscarLista("/clientes/buscar", { nomeContato: termo }),
                buscarLista("/clientes/buscar", { nomeEmpresa: termo }),
                buscarLista("/fornecedores/buscar-geral", { nomeContato: termo }),
                buscarLista("/fornecedores/buscar-geral", { nomeEmpresa: termo }),
            ]);

            if (cancelado) return;

            // O mesmo contato pode vir nas duas buscas: deduplica por tipo + id
            const unicos = new Map();

            [
                ...[...cContato, ...cEmpresa].map((item) => normalizarContato(item, "cliente")),
                ...[...fContato, ...fEmpresa].map((item) => normalizarContato(item, "fornecedor")),
            ]
                .filter(Boolean)
                .forEach((item) => unicos.set(`${item.tipo}-${item.id}`, item));

            setSugestoes([...unicos.values()].slice(0, 8));
        };

        const timer = setTimeout(buscarContatos, 250);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [busca, contato]);

    useEffect(() => {
        if (modoEdicao) onEstadoChange?.({ codigo, contato });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codigo, contato, modoEdicao]);

    const adicionar = async () => {
        const codigoInformado = codigo.trim();
        if (!codigoInformado) return;

        if (!contato) {
            setErro("Selecione um cliente ou fornecedor antes de associar o código.");
            return;
        }

        setErro("");

        try {
            const mensagem = await onAdicionar?.({ codigo: codigoInformado, contato });
            if (mensagem) {
                setErro(mensagem);
                return;
            }

            setCodigo("");
            setBusca("");
            setSugestoes([]);
            setContato(null);
        } catch (error) {
            console.error("Erro ao associar código:", error);
            setErro(
                error?.response?.data?.message ||
                "Não foi possível associar o código ao cliente ou fornecedor.",
            );
        }
    };

    return (
        <div className={styles.associationContent}>
            <div className={styles.searchField}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                </svg>
                <input
                    id="buscar-contato-codigo"
                    name="buscarContato"
                    type="text"
                    autoComplete="off"
                    aria-label="Buscar cliente ou fornecedor"
                    value={busca}
                    placeholder="Digite o nome do cliente ou fornecedor"
                    onChange={(event) => {
                        setBusca(event.target.value);
                        setContato(null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") event.preventDefault();
                    }}
                />
            </div>

            {sugestoes.length > 0 && (
                <div className={styles.contactDropdown} role="listbox" aria-label="Contatos sugeridos">
                    {sugestoes.map((sugestao) => (
                        <button
                            key={`${sugestao.tipo}-${sugestao.id}`}
                            type="button"
                            className={styles.contactOption}
                            onClick={() => {
                                setContato(sugestao);
                                setBusca(sugestao.label);
                                setSugestoes([]);
                            }}
                        >
                            <span className={styles.contactTypeBadge}>{sugestao.tipo}</span>
                            <span className={styles.contactText}>
                                <strong>{sugestao.nomeEmpresa}</strong>
                                <small>{sugestao.nomeContato}</small>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.codeRow}>
                <label htmlFor="codigo-associado">Código</label>
                <input
                    id="codigo-associado"
                    name="codigoAssociado"
                    type="text"
                    autoComplete="off"
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            if (!modoEdicao) adicionar();
                        }
                    }}
                />
                {!modoEdicao && (
                    <div className={styles.addButton}>
                        <Button type="button" estilo="editar" onClick={adicionar}>
                            Adicionar
                        </Button>
                    </div>
                )}
            </div>

            <div className={styles.unregisteredContact}>
                <span>Contato não cadastrado?</span>
                <div className={styles.registerActions}>
                    <button type="button" onClick={() => onCadastrarContato?.("cliente")}>
                        Cliente
                    </button>
                    <button type="button" onClick={() => onCadastrarContato?.("fornecedor")}>
                        Fornecedor
                    </button>
                </div>
            </div>

            {erro && <p className={styles.erro}>{erro}</p>}

            {!modoEdicao && (
                <div className={styles.itemsList}>
                    {itens.map((item) => (
                        <div className={styles.codeItem} key={item.id}>
                            <button
                                type="button"
                                aria-label={`Remover código ${item.codigo}`}
                                onClick={() => onRemover?.(item.id)}
                            >
                                X
                            </button>
                            <span>{item.codigo}</span>
                            <span>{item.contato}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AssociarCodigoForm;