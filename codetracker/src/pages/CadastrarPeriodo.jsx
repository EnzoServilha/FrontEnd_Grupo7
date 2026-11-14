import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { api } from "../provider/api";
import styles from "./CadastrarPeriodo.module.css";

function CadastrarPeriodo() {
    const navigate = useNavigate();
    const [etapa, setEtapa] = useState(1);
    const [anotacao, setAnotacao] = useState("");

    const [numeroProximoPeriodo, setNumeroProximoPeriodo] = useState("---");
    const [quantidadePecas, setQuantidadePecas] = useState("0");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // Carrega o resumo do período atual / estoque ao abrir a tela
    useEffect(() => {
        async function carregarDadosResumo() {
            try {
                // Busca o último período para saber o número e calcular o próximo
                const respostaUltimo = await api.get("/periodos/ultimo");
                const ultimoPeriodo = respostaUltimo.data;

                if (ultimoPeriodo && ultimoPeriodo.id) {
                    const proximoId = ultimoPeriodo.id + 1;
                    setNumeroProximoPeriodo(String(proximoId).padStart(2, "0"));
                }

                // Busca o estoque atual do período aberto para somar as peças
                const respostaEstoque = await api.get("/periodos/estoque-atual");
                const saldos = Array.isArray(respostaEstoque.data) ? respostaEstoque.data : [];

                // Soma a quantidade de peças de todos os itens no estoque atual
                const totalPecas = saldos.reduce((soma, item) => soma + (item.qtd || 0), 0);
                setQuantidadePecas(totalPecas.toLocaleString("pt-BR"));
            } catch (err) {
                console.error("Erro ao carregar dados para o novo período:", err);
                setErro("Não foi possível carregar os dados do estoque atual.");
            } finally {
                setCarregando(false);
            }
        }

        carregarDadosResumo();
    }, []);

    function cancelar() {
        navigate("/periodo");
    }

    async function confirmar() {
        try {
            setCarregando(true);
            setErro("");

            // Chama o endpoint PUT /periodos/fechar do seu backend,
            // passando a descrição do novo período via RequestParam
            const descricao = anotacao.trim() || "Período criado automaticamente após fechamento";

            await api.put(`/periodos/fechar`, null, {
                params: { descricaoNovoPeriodo: descricao }
            });

            navigate("/periodo");
        } catch (err) {
            console.error("Erro ao fechar/criar período:", err);
            setErro(
                err?.response?.data?.message ||
                "Não foi possível concluir o fechamento do período."
            );
            setEtapa(2); // Retorna para a etapa anterior para o usuário ver o erro ou tentar novamente
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className={styles.pagina}>
            <header className={styles.topo}>
                <Logo />
            </header>

            {erro && (
                <div style={{ color: "#dc2626", textAlign: "center", margin: "10px 0", fontWeight: 600 }}>
                    {erro}
                </div>
            )}

            {etapa < 3 && (
                <main className={styles.conteudo}>
                    <h1 className={styles.titulo}>Novo período</h1>
                    <p className={styles.aviso}>
                        Só inicie um novo período se tiver{" "}
                        <strong>certeza absoluta</strong>
                        <br />
                        dos dados atuais do inventário e estoque.
                    </p>

                    <section className={styles.card}>
                        {etapa === 1 && (
                            <>
                                <h2 className={styles.cardTitulo}>Resumo do Período</h2>
                                <div className={styles.info}>
                                    <span>Número do novo período:</span>
                                    <strong>{carregando ? "Carregando..." : numeroProximoPeriodo}</strong>
                                </div>
                                <div className={styles.info}>
                                    <span>Quantidade Total de Peças:</span>
                                    <strong>{carregando ? "Carregando..." : quantidadePecas}</strong>
                                </div>
                            </>
                        )}

                        {etapa === 2 && (
                            <>
                                <label htmlFor="anotacao" className={styles.label}>
                                    Anotações informativas sobre o período
                                </label>
                                <textarea
                                    id="anotacao"
                                    className={styles.textarea}
                                    placeholder="Ex: Fechamento do primeiro trimestre, balanço de peças sobressalentes pendentes..."
                                    value={anotacao}
                                    onChange={(e) => setAnotacao(e.target.value)}
                                />
                            </>
                        )}
                    </section>

                    <div className={styles.acoes}>
                        <Button estilo="editar" onClick={cancelar} disabled={carregando}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => setEtapa(etapa + 1)}
                            disabled={carregando}
                        >
                            {carregando ? "Aguarde..." : "Continuar"}
                        </Button>
                    </div>
                </main>
            )}

            {etapa === 3 && (
                <main className={styles.conteudoCentral}>
                    <section className={styles.confirmacao}>
                        <h2 className={styles.confirmacaoTitulo}>
                            Novo Período: <span>{numeroProximoPeriodo}</span>
                        </h2>
                        <div className={styles.alerta}>
                            Uma vez criado e consolidado o novo período, o sistema irá
                            congelar os dados anteriores de forma permanente para auditoria e transferir os saldos atuais e movimentações pendentes.
                        </div>
                        <div className={styles.confirmacaoAcoes}>
                            <Button estilo="editar" onClick={cancelar} disabled={carregando}>
                                Cancelar
                            </Button>
                            <Button onClick={confirmar} disabled={carregando}>
                                {carregando ? "Processando..." : "Confirmar"}
                            </Button>
                        </div>
                    </section>
                </main>
            )}
        </div>
    );
}

export default CadastrarPeriodo;