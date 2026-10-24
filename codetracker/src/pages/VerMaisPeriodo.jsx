import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import SearchBar from "../components/SearchBar";
import ServerResponse from "../components/ServerResponse";
import Table from "../components/Table";
import { api } from "../provider/api";
import styles from "./VerMaisPeriodo.module.css";

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

const columns = [
    { name: "Código Interno" },
    { name: "Preço Total", ordena: true, tipo: "number" },
    { name: "Preço Unitário", ordena: true, tipo: "number" },
    { name: "Qtd. Itens", ordena: true, tipo: "number" },
];

const formatarMoeda = (valor) => {
    const numero = Number(valor);
    if (valor === null || valor === undefined || Number.isNaN(numero)) return "---";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numero);
};

/* ---------- Chamadas à API ---------- */

// Mesmo endpoint da tela Período; filtra pelo id do período selecionado.
const buscarPeriodo = async (id) => {
    const resposta = await api.get("/periodos");
    const lista = Array.isArray(resposta.data) ? resposta.data : [];
    const encontrado = lista.find((p) => Number(p.id) === Number(id));
    return encontrado ? mapearPeriodo(encontrado) : null;
};

const buscarItens = async (id) => {
    const resposta = await api.get(`/itensNaMovimentacao/item/periodo/${id}`);
    const dados = resposta.data;
    if (Array.isArray(dados)) return dados;
    return dados ? [dados] : [];
};

function VerMaisPeriodo() {
    const navigate = useNavigate();
    const location = useLocation();
    const periodoBase = location.state?.periodo ?? null;
    const periodoId = periodoBase?.id;

    // Começa com o que veio da lista e é atualizado com o retorno da API.
    const [periodo, setPeriodo] = useState(periodoBase);
    const [itens, setItens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        if (!periodoId) {
            setCarregando(false);
            return;
        }

        let ativo = true;

        const carregar = async () => {
            setCarregando(true);
            setErro("");

            const [resPeriodo, resItens] = await Promise.allSettled([
                buscarPeriodo(periodoId),
                buscarItens(periodoId),
            ]);

            // Evita sobrescrever o estado se o usuário já saiu da tela
            if (!ativo) return;

            if (resPeriodo.status === "fulfilled") {
                if (resPeriodo.value) setPeriodo(resPeriodo.value);
            } else {
                console.error("Erro ao buscar período:", resPeriodo.reason);
            }

            if (resItens.status === "fulfilled") {
                setItens(resItens.value);
            } else {
                console.error("Erro ao buscar itens do período:", resItens.reason);
                setItens([]);
            }

            if (resPeriodo.status === "rejected" || resItens.status === "rejected") {
                setErro("Não foi possível carregar todos os dados do período.");
            }

            setCarregando(false);
        };

        carregar();

        return () => {
            ativo = false;
        };
    }, [periodoId]);

    const rows = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");

        return itens
            .filter((registro) => {
                if (!termo) return true;
                const codigo = registro?.item?.codigoInterno ?? "";
                return String(codigo).toLocaleLowerCase("pt-BR").includes(termo);
            })
            .map((registro, idx) => {
                const qtd = Number(registro?.qtd ?? 0);
                const precoUnitario = Number(registro?.precoUnitario ?? 0);

                return {
                    id: registro?.id ?? idx,
                    cells: [
                        <strong key="c">{registro?.item?.codigoInterno ?? "---"}</strong>,
                        formatarMoeda(qtd * precoUnitario),
                        formatarMoeda(precoUnitario),
                        qtd,
                    ],
                };
            });
    }, [busca, itens]);

    const handleVoltar = () => navigate("/periodo");

    if (!periodoBase) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.content}>
                    <section className={styles.infoCard}>
                        <p>Nenhum período selecionado. Volte para a lista e selecione um item.</p>
                        <Button onClick={handleVoltar}>Voltar para Período</Button>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.content}>
                {erro && (
                    <ServerResponse
                        type="error"
                        title="Falha ao carregar"
                        message={erro}
                    />
                )}

                <section className={styles.infoCard}>
                    <div className={styles.titleRow}>
                        <button
                            type="button"
                            className={styles.backBtn}
                            onClick={handleVoltar}
                            aria-label="Voltar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#000">
                                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                            </svg>
                        </button>
                        <h1 className={styles.title}>Período - Número {periodo.numero}</h1>
                    </div>

                    <div className={styles.info}>
                        <dl className={styles.infoLeft}>
                            <dt>Data de Cadastro</dt>
                            <dd>{periodo.dataCadastro}</dd>
                            <dt>Qtd. Itens:</dt>
                            <dd>{periodo.totalPecas}</dd>
                        </dl>
                        <div className={styles.notes}>
                            <span className={styles.notesLabel}>Anotações:</span>
                            <p className={styles.notesText}>{periodo.anotacoes}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.tableSection}>
                    <div className={styles.toolbar}>
                        <button type="button" className={styles.dropdownBtn} aria-label="Filtros">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#0f172a">
                                <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                            </svg>
                        </button>
                        <SearchBar
                            placeholder="Buscar item..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            size="240px"
                        />
                    </div>

                    <div className={styles.tableWrapper}>
                        {carregando ? (
                            <p>Carregando itens...</p>
                        ) : (
                            <Table columns={columns} rows={rows} removerNaOrdenacao="R$" />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default VerMaisPeriodo;