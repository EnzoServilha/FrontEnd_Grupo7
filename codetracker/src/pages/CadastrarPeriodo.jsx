import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import styles from "./CadastrarPeriodo.module.css";

function CadastrarPeriodo() {
    const navigate = useNavigate();
    const [etapa, setEtapa] = useState(1);
    const [anotacao, setAnotacao] = useState("");

    // TODO: trocar pelos valores reais vindos da API
    const numeroCadastrarPeriodo = "04";
    const quantidadePecas = "04";

    function cancelar() {
        navigate("/periodo"); // ajuste para a sua rota
    }

    async function confirmar() {
        // TODO: chamar o endpoint de criação do período, por exemplo:
        // await fetch("/periodos", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ anotacao }),
        // });
        navigate("/periodo");
    }

    return (
        <div className={styles.pagina}>
            <header className={styles.topo}>
                <Logo />
            </header>

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
                                    <strong>{numeroCadastrarPeriodo}</strong>
                                </div>
                                <div className={styles.info}>
                                    <span>Quantidade de Peças:</span>
                                    <strong>{quantidadePecas}</strong>
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
                        <Button estilo="editar" onClick={cancelar}>
                            Cancelar
                        </Button>
                        <Button onClick={() => setEtapa(etapa + 1)}>Continuar</Button>
                    </div>
                </main>
            )}

            {etapa === 3 && (
                <main className={styles.conteudoCentral}>
                    <section className={styles.confirmacao}>
                        <h2 className={styles.confirmacaoTitulo}>
                            Novo Período: <span>{numeroCadastrarPeriodo}</span>
                        </h2>
                        <div className={styles.alerta}>
                            Uma vez criado e consolidado o novo período, o sistema irá
                            congelar os dados anteriores de forma permanente para auditoria.
                        </div>
                        <div className={styles.confirmacaoAcoes}>
                            <Button estilo="editar" onClick={cancelar}>
                                Cancelar
                            </Button>
                            <Button onClick={confirmar}>Confirmar</Button>
                        </div>
                    </section>
                </main>
            )}
        </div>
    );
}

export default CadastrarPeriodo;