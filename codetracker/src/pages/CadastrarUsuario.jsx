import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

// Na edição a senha é opcional: só é validada se o usuário preencher algo
const validar = ({ nome, email, senha, confirmacao }, modoEdicao) => {
    const erros = {};

    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
        erros.nome = "O nome deve ter entre 3 e 100 caracteres.";
    }

    const emailLimpo = email.trim();
    if (!emailLimpo || emailLimpo.length > 150 || !REGEX_EMAIL.test(emailLimpo)) {
        erros.email = "Informe um e-mail válido (até 150 caracteres).";
    }

    const validarSenha = !modoEdicao || senha !== "" || confirmacao !== "";

    if (validarSenha) {
        if (senha.length < 8 || senha.length > 72) {
            erros.senha = "A senha deve ter entre 8 e 72 caracteres.";
        } else if (!REGEX_SENHA.test(senha)) {
            erros.senha =
                "A senha precisa de letra maiúscula, minúscula, número e caractere especial, sem espaços.";
        }

        if (confirmacao !== senha) {
            erros.confirmacao = "As senhas não coincidem.";
        }
    }

    return erros;
};

const mensagemDeErro = (error, modoEdicao) => {
    const mensagem = error?.response?.data?.message;
    if (mensagem) return mensagem;
    if (error?.response?.status === 403) {
        return modoEdicao
            ? "Você não tem permissão para editar usuários."
            : "Você não tem permissão para cadastrar usuários.";
    }
    return modoEdicao
        ? "Não foi possível salvar as alterações do usuário."
        : "Não foi possível cadastrar o usuário.";
};

function CadastrarUsuario() {
    const navigate = useNavigate();
    const location = useLocation();

    const usuarioEdicao = location.state?.usuario ?? null;
    const modoEdicao = Boolean(location.state?.modoEdicao && usuarioEdicao?.id);

    const [formulario, setFormulario] = useState(() =>
        modoEdicao
            ? {
                ...formularioInicial,
                nome: usuarioEdicao.nome ?? "",
                email: usuarioEdicao.email ?? "",
            }
            : formularioInicial,
    );
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState("");
    const [salvando, setSalvando] = useState(false);

    const atualizar = (campo, valor) => {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    };

    // Volta para a lista já na aba de administração
    const voltarParaLista = () =>
        navigate("/usuarios", { state: { tab: "administrar" } });

    const salvar = async (event) => {
        event.preventDefault();
        setErroGeral("");

        const encontrados = validar(formulario, modoEdicao);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        const corpo = {
            nome: formulario.nome.trim(),
            email: formulario.email.trim(),
        };

        try {
            setSalvando(true);

            if (modoEdicao) {
                // Senha em branco = manter a atual
                if (formulario.senha) corpo.senha = formulario.senha;
                await api.put(`/usuarios/${usuarioEdicao.id}`, corpo);
            } else {
                await api.post("/usuarios", {
                    ...corpo,
                    senha: formulario.senha,
                    permissaoId: formulario.permissaoId,
                });
            }

            voltarParaLista();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            setErroGeral(mensagemDeErro(error, modoEdicao));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className={baseStyles.page}>
            <header className={`${baseStyles.header} ${pecaStyles.header}`}>
                <Logo />
                <h1>{modoEdicao ? "Editar Usuário" : "Cadastrar Usuário"}</h1>

                <div className={pecaStyles.helpAction}>
                    <HelpButton />
                </div>
            </header>

            <main className={baseStyles.content}>
                <form className={baseStyles.form} onSubmit={salvar} noValidate>
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
                                    <label htmlFor="senha-usuario">
                                        {modoEdicao ? "Nova senha:" : "Senha:"}
                                    </label>
                                    <input
                                        id="senha-usuario"
                                        name="senha"
                                        type="password"
                                        autoComplete="new-password"
                                        maxLength={72}
                                        value={formulario.senha}
                                        onChange={(event) => atualizar("senha", event.target.value)}
                                        placeholder={
                                            modoEdicao
                                                ? "Deixe em branco para manter a atual"
                                                : "Mínimo de 8 caracteres"
                                        }
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
                                    <label htmlFor="confirmacao-usuario">
                                        {modoEdicao ? "Confirmar nova senha:" : "Confirmar senha:"}
                                    </label>
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

                        {/* Na edição o cargo é alterado pela tela de usuários ("Alterar Cargo") */}
                        {!modoEdicao && (
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
                        )}
                    </section>

                    <footer className={`${baseStyles.footerActions} ${pecaStyles.footerActions}`}>
                        <Button type="button" estilo="editar" onClick={voltarParaLista}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando}>
                            {salvando
                                ? modoEdicao ? "Salvando..." : "Cadastrando..."
                                : modoEdicao ? "Salvar" : "Cadastrar"}
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
                                title={
                                    modoEdicao
                                        ? "Falha ao editar o usuário"
                                        : "Falha ao cadastrar o usuário"
                                }
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