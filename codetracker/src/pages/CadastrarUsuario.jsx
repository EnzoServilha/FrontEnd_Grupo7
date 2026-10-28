import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ServerResponse from "../components/ServerResponse";
import HelpButton from "../helpfeat/HelpButton";
import baseStyles from "./CadastrarCliente.module.css";
import pecaStyles from "./CadastrarPeca.module.css";
import styles from "./CadastrarUsuario.module.css";

// ids conforme o INSERT da tabela permissao
const PERMISSOES = [
    { id: 2, rotulo: "Usuário" },
    { id: 1, rotulo: "Administrador" },
];

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mesma regra do @Pattern do UsuarioCriacaoDto
const REGEX_SENHA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\p{L}\p{N}\s])\S+$/u;

const formularioInicial = {
    nome: "",
    email: "",
    senha: "",
    confirmacao: "",
    permissaoId: 2,
};

const validar = ({ nome, email, senha, confirmacao }) => {
    const erros = {};

    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
        erros.nome = "O nome deve ter entre 3 e 100 caracteres.";
    }

    const emailLimpo = email.trim();
    if (!emailLimpo || emailLimpo.length > 150 || !REGEX_EMAIL.test(emailLimpo)) {
        erros.email = "Informe um e-mail válido (até 150 caracteres).";
    }

    if (senha.length < 8 || senha.length > 72) {
        erros.senha = "A senha deve ter entre 8 e 72 caracteres.";
    } else if (!REGEX_SENHA.test(senha)) {
        erros.senha =
            "A senha precisa de letra maiúscula, minúscula, número e caractere especial, sem espaços.";
    }

    if (confirmacao !== senha) {
        erros.confirmacao = "As senhas não coincidem.";
    }

    return erros;
};

const mensagemDeErro = (error) => {
    const mensagem = error?.response?.data?.message;
    if (mensagem) return mensagem;
    if (error?.response?.status === 403) {
        return "Você não tem permissão para cadastrar usuários.";
    }
    return "Não foi possível cadastrar o usuário.";
};

function CadastrarUsuario() {
    const navigate = useNavigate();
    const [formulario, setFormulario] = useState(formularioInicial);
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState("");
    const [salvando, setSalvando] = useState(false);

    const atualizar = (campo, valor) => {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    };

    const cadastrar = async (event) => {
        event.preventDefault();
        setErroGeral("");

        const encontrados = validar(formulario);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        try {
            setSalvando(true);
            await api.post("/usuarios", {
                nome: formulario.nome.trim(),
                email: formulario.email.trim(),
                senha: formulario.senha,
                permissaoId: formulario.permissaoId,
            });
            navigate("/usuarios");
        } catch (error) {
            console.error("Erro ao cadastrar usuário:", error);
            setErroGeral(mensagemDeErro(error));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className={baseStyles.page}>
            <header className={`${baseStyles.header} ${pecaStyles.header}`}>
                <Logo />
                <h1>Cadastrar Usuário</h1>

                <div className={pecaStyles.helpAction}>
                    <HelpButton />
                </div>
            </header>

            <main className={baseStyles.content}>
                <form className={baseStyles.form} onSubmit={cadastrar} noValidate>
                    <section
                        className={`${baseStyles.card} ${styles.card}`}
                        aria-labelledby="titulo-cadastro-usuario"
                    >
                        <h2 id="titulo-cadastro-usuario">Dados do Usuário</h2>

                        <div className={baseStyles.generalGrid}>
                            <div className={baseStyles.column}>
                                <Input
                                    id="nome-usuario"
                                    label="Nome:"
                                    value={formulario.nome}
                                    onChange={(event) => atualizar("nome", event.target.value)}
                                    placeholder="Digite o nome completo"
                                />
                                {erros.nome && <small className={styles.erroCampo}>{erros.nome}</small>}

                                <Input
                                    id="email-usuario"
                                    label="E-mail:"
                                    value={formulario.email}
                                    onChange={(event) => atualizar("email", event.target.value)}
                                    placeholder="Digite o e-mail de acesso"
                                />
                                {erros.email && <small className={styles.erroCampo}>{erros.email}</small>}
                            </div>

                            <div className={baseStyles.column}>
                                <div className={styles.campo}>
                                    <label htmlFor="senha-usuario">Senha:</label>
                                    <input
                                        id="senha-usuario"
                                        name="senha"
                                        type="password"
                                        autoComplete="new-password"
                                        maxLength={72}
                                        value={formulario.senha}
                                        onChange={(event) => atualizar("senha", event.target.value)}
                                        placeholder="Mínimo de 8 caracteres"
                                    />
                                </div>
                                {erros.senha ? (
                                    <small className={styles.erroCampo}>{erros.senha}</small>
                                ) : (
                                    <small className={styles.dica}>
                                        Use maiúscula, minúscula, número e caractere especial.
                                    </small>
                                )}

                                <div className={styles.campo}>
                                    <label htmlFor="confirmacao-usuario">Confirmar senha:</label>
                                    <input
                                        id="confirmacao-usuario"
                                        name="confirmacaoSenha"
                                        type="password"
                                        autoComplete="new-password"
                                        maxLength={72}
                                        value={formulario.confirmacao}
                                        onChange={(event) => atualizar("confirmacao", event.target.value)}
                                        placeholder="Repita a senha"
                                    />
                                </div>
                                {erros.confirmacao && (
                                    <small className={styles.erroCampo}>{erros.confirmacao}</small>
                                )}
                            </div>
                        </div>

                        <div className={styles.permissaoLinha}>
                            <span>Permissão:</span>
                            <fieldset className={baseStyles.customerType}>
                                <legend>Permissão</legend>
                                {PERMISSOES.map((permissao) => (
                                    <label key={permissao.id}>
                                        <input
                                            type="radio"
                                            name="permissao"
                                            value={permissao.id}
                                            checked={formulario.permissaoId === permissao.id}
                                            onChange={() => atualizar("permissaoId", permissao.id)}
                                        />
                                        {permissao.rotulo}
                                    </label>
                                ))}
                            </fieldset>
                        </div>
                    </section>

                    <footer className={`${baseStyles.footerActions} ${pecaStyles.footerActions}`}>
                        <Button type="button" estilo="editar" onClick={() => navigate("/usuarios")}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando}>
                            {salvando ? "Cadastrando..." : "Cadastrar"}
                        </Button>
                    </footer>
                </form>

                {erroGeral && (
                    <div className={pecaStyles.errorOverlay} onClick={() => setErroGeral("")}>
                        <div
                            className={pecaStyles.errorPopup}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <ServerResponse
                                type="error"
                                title="Falha ao cadastrar o usuário"
                                message={erroGeral}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CadastrarUsuario;