import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Usuarios.module.css";

const placeholder = "---";

const tabs = [
  ["meu-usuario", "Meu usuário"],
  ["administrar", "Administrar Usuários"],
];

// Pesquisar por
const camposBusca = [
  ["todos", "Nome e Email"],
  ["nome", "Nome"],
  ["email", "Email"],
];

// Filtrar por
const statusDisponiveis = [
  ["todos", "Todos os status"],
  ["ativo", "Ativo"],
  ["desativo", "Desativo"],
];

const cargosDisponiveis = [
  ["todos", "Todos os cargos"],
  ["ROLE_ADMIN", "Admin"],
  ["ROLE_USER", "Comum"],
];

const filtrosIniciais = { status: "todos", cargo: "todos", dataDe: "", dataAte: "" };

const columns = [
  { name: "Nome", ordena: true, tipo: "string" },
  { name: "Data cadastro", ordena: true, tipo: "date" },
  { name: "Email", ordena: true, tipo: "string" },
  { name: "Cargo", ordena: true, tipo: "string" },
  { name: "Status", ordena: false, tipo: "string" },
];

// ids conforme o INSERT da tabela permissao
const PERMISSAO_ID = { ROLE_ADMIN: 1, ROLE_USER: 2 };

const lerUsuarioLogado = () => {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado")) ?? null;
  } catch {
    return null;
  }
};

// Lê o dia direto da string para não perder um dia por causa do fuso horário
const formatarData = (valor) => {
  if (!valor) return placeholder;

  const encontrado = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (encontrado) return `${encontrado[3]}/${encontrado[2]}/${encontrado[1]}`;

  return String(valor);
};

const mensagemDeErro = (error, padrao) =>
  error?.response?.data?.message || padrao;

const normalizarUsuario = (usuario) => {
  const cargoRole = usuario.permissao?.nome ?? usuario.cargo ?? null;
  const ativo = usuario.ativo !== false;

  return {
    id: usuario.id,
    nome: usuario.nome ?? placeholder,
    email: usuario.email ?? placeholder,
    dataCadastro: formatarData(usuario.dataCadastro),
    dataIso: (String(usuario.dataCadastro ?? "").match(/^\d{4}-\d{2}-\d{2}/) ?? [""])[0],
    cargoRole,
    cargo: cargoRole === "ROLE_ADMIN" ? "Admin" : "Comum",
    ativo,
    status: ativo ? "Ativo" : "Desativo",
    statusClass: ativo ? "ativo" : "desativo",
  };
};

function Usuarios() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuarioLogado = useMemo(lerUsuarioLogado, []);
  const isAdmin = usuarioLogado?.role === "ROLE_ADMIN";

  const [usuarios, setUsuarios] = useState([]);
  const [meuUsuario, setMeuUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [tabAtiva, setTabAtiva] = useState(
    location.state?.tab === "administrar" ? "administrar" : "meu-usuario",
  );
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErroLista("");
      const resposta = await api.get("/usuarios/administracao", {
        params: { ativo: "todos" },
      });
      setUsuarios(Array.isArray(resposta.data) ? resposta.data : []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsuarios([]);
      setErroLista(mensagemDeErro(error, "Não foi possível carregar os usuários."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) carregarUsuarios();
  }, [isAdmin, carregarUsuarios]);

  useEffect(() => {
    let cancelado = false;

    api
      .get("/usuarios/me")
      .then((resposta) => {
        if (!cancelado) setMeuUsuario(resposta.data);
      })
      .catch((error) => console.error("Erro ao carregar o usuário logado:", error));

    return () => {
      cancelado = true;
    };
  }, []);

  const usuariosNormalizados = useMemo(
    () => usuarios.map(normalizarUsuario),
    [usuarios],
  );

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return usuariosNormalizados.filter((usuario) => {
      if (filtros.status !== "todos" && usuario.statusClass !== filtros.status) return false;
      if (filtros.cargo !== "todos" && usuario.cargoRole !== filtros.cargo) return false;

      // Datas no formato aaaa-mm-dd: a comparação de texto respeita a ordem cronológica
      if (filtros.dataDe && (!usuario.dataIso || usuario.dataIso < filtros.dataDe)) return false;
      if (filtros.dataAte && (!usuario.dataIso || usuario.dataIso > filtros.dataAte)) return false;

      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? [usuario.nome, usuario.email]
          : [usuario[campoBusca]];

      return valores.some((valor) =>
        String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [usuariosNormalizados, busca, campoBusca, filtros]);

  const atualizarFiltro = (parcial) =>
    setFiltros((atuais) => ({ ...atuais, ...parcial }));

  const rowIds = usuariosFiltrados.map((usuario) => usuario.id);

  const rows = usuariosFiltrados.map((usuario) => [
    usuario.nome,
    usuario.dataCadastro,
    usuario.email,
    usuario.cargo,
    <span className={`${styles.statusBadge} ${styles[usuario.statusClass]}`}>
      {usuario.status}
    </span>,
  ]);

  const rowsExibidos = rows.length
    ? rows
    : [[placeholder, placeholder, placeholder, placeholder, placeholder]];

  // O Table só recarrega quando os ids mudam. Como trocar cargo/status não
  // muda os ids, esta chave (com o conteúdo) força o Table a remontar.
  const chaveTabela = usuariosFiltrados
    .map((u) => `${u.id}:${u.nome}:${u.email}:${u.cargoRole}:${u.status}`)
    .join("|");

  useEffect(() => {
    setSelecionados([]);
  }, [chaveTabela]);

  const campoBuscaAtivo = camposBusca.find(([valor]) => valor === campoBusca)?.[1];

  // Executa uma requisição para cada usuário selecionado e recarrega a lista.
  // O admin logado fica de fora para não se desativar nem se rebaixar sem querer.
  const executarNosSelecionados = async (requisicao, { somenteAtivos = false } = {}) => {
    const alvos = usuariosNormalizados.filter(
      (usuario) =>
        selecionados.includes(usuario.id) &&
        usuario.email !== usuarioLogado?.email &&
        (!somenteAtivos || usuario.ativo),
    );

    if (alvos.length === 0) {
      setSelecionados([]);
      return;
    }

    const resultados = await Promise.allSettled(alvos.map(requisicao));
    const falha = resultados.find((resultado) => resultado.status === "rejected");

    if (falha) {
      console.error("Erro ao atualizar usuários:", falha.reason);
      alert(mensagemDeErro(falha.reason, "Alguns usuários não puderam ser atualizados."));
    }

    await carregarUsuarios();
    setSelecionados([]);
  };

  const alterarCargoSelecionados = (event) => {
    const novoCargo = event.target.value;
    const permissaoId = PERMISSAO_ID[novoCargo];
    if (!permissaoId || selecionados.length === 0) return;

    executarNosSelecionados(
      (usuario) => api.patch(`/usuarios/${usuario.id}/permissao/${permissaoId}`),
      { somenteAtivos: true },
    );
  };

  const alternarStatusSelecionados = () => {
    if (selecionados.length === 0) return;
    // TODO: gerar aqui o log de desativação.
    executarNosSelecionados((usuario) =>
      usuario.ativo
        ? api.patch(`/usuarios/${usuario.id}/desativacao`)
        : api.patch(`/usuarios/${usuario.id}/reativacao`),
    );
  };

  const criarUsuario = () => navigate("/cadastrarUsuario");

  const editarUsuario = (usuario) => {
    if (!usuario?.id) return;
    navigate("/cadastrarUsuario", {
      state: {
        modoEdicao: true,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      },
    });
  };

  const editarSelecionado = () => {
    if (selecionados.length !== 1) return;
    editarUsuario(usuariosNormalizados.find((usuario) => usuario.id === selecionados[0]));
  };

  const mostrarMeuUsuario = !isAdmin || tabAtiva === "meu-usuario";

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        {isAdmin && (
          <div className={styles.tabs} role="tablist" aria-label="Seções de usuários">
            {tabs.map(([valor, label]) => (
              <button
                type="button"
                role="tab"
                key={valor}
                aria-selected={tabAtiva === valor}
                className={tabAtiva === valor ? styles.activeTab : ""}
                onClick={() => {
                  setTabAtiva(valor);
                  setSelecionados([]);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mostrarMeuUsuario ? (
          <section className={styles.card} aria-label="Meu usuário">
            <div className={styles.cardTitle}>
              <h1>Meu Usuário</h1>
              {/* A edição é restrita a administradores no back-end */}
              {isAdmin && (
                <Button
                  icone="editar"
                  estilo="editar"
                  disabled={!meuUsuario?.id}
                  onClick={() => editarUsuario(meuUsuario)}
                >
                  Editar
                </Button>
              )}
            </div>

            <div className={styles.cardData}>
              <span>Nome: {meuUsuario?.nome ?? placeholder}</span>
              <span>Email: {meuUsuario?.email ?? usuarioLogado?.email ?? placeholder}</span>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.toolbar} aria-label="Ações dos usuários">
              <div className={styles.searchActions}>
                <div className={styles.menuContainer}>
                  <button
                    type="button"
                    className={styles.optionsButton}
                    aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                    aria-expanded={menuBuscaAberto}
                    aria-controls="campos-busca-usuarios"
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
                    <div id="campos-busca-usuarios" className={styles.popover} role="menu">
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
                    placeholder="Buscar nos usuários..."
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    ariaLabel="Buscar nos usuários"
                  />
                </div>

                <div className={styles.menuContainer}>
                  <Filtro
                    ariaLabel="Filtrar usuários por status"
                    onClick={() => {
                      setFiltroAberto((aberto) => !aberto);
                      setMenuBuscaAberto(false);
                    }}
                  />

                  {filtroAberto && (
                    <div
                      className={`${styles.popover} ${styles.filterPopover} ${styles.filterPanel}`}
                      role="dialog"
                      aria-label="Filtros de usuários"
                    >
                      <fieldset className={styles.filterGroup}>
                        <legend>Data de cadastro</legend>
                        <div className={styles.rangeRow}>
                          <input
                            type="date"
                            aria-label="Data inicial"
                            value={filtros.dataDe}
                            max={filtros.dataAte || undefined}
                            onChange={(event) => atualizarFiltro({ dataDe: event.target.value })}
                          />
                          <span>até</span>
                          <input
                            type="date"
                            aria-label="Data final"
                            value={filtros.dataAte}
                            min={filtros.dataDe || undefined}
                            onChange={(event) => atualizarFiltro({ dataAte: event.target.value })}
                          />
                        </div>
                      </fieldset>

                      <fieldset className={styles.filterGroup}>
                        <legend>Cargo</legend>
                        <select
                          value={filtros.cargo}
                          onChange={(event) => atualizarFiltro({ cargo: event.target.value })}
                        >
                          {cargosDisponiveis.map(([valor, label]) => (
                            <option key={valor} value={valor}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </fieldset>

                      <fieldset className={styles.filterGroup}>
                        <legend>Status</legend>
                        <select
                          value={filtros.status}
                          onChange={(event) => atualizarFiltro({ status: event.target.value })}
                        >
                          {statusDisponiveis.map(([valor, label]) => (
                            <option key={valor} value={valor}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </fieldset>

                      <div className={styles.filterActions}>
                        <button
                          type="button"
                          className={styles.clearButton}
                          onClick={() => setFiltros(filtrosIniciais)}
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionControls}>
                <select
                  className={styles.statusSelect}
                  aria-label="Alterar cargo dos usuários selecionados"
                  value=""
                  disabled={selecionados.length === 0}
                  onChange={alterarCargoSelecionados}
                >
                  <option value="" disabled>
                    Alterar Cargo
                  </option>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_USER">Comum</option>
                </select>

                <div className={styles.actionButtons}>
                  <Button
                    icone="editar"
                    estilo="editar"
                    disabled={selecionados.length !== 1}
                    onClick={editarSelecionado}
                  >
                    Editar
                  </Button>
                  <Button
                    estilo="deletar"
                    disabled={selecionados.length === 0}
                    onClick={alternarStatusSelecionados}
                  >
                    Ativar/ Desativar
                  </Button>
                  <Button icone="adicionar" onClick={criarUsuario}>
                    Criar Usuário
                  </Button>
                </div>
              </div>
            </section>

            <section className={styles.tableSection} aria-label="Lista de usuários">
              {erroLista && <p role="alert">{erroLista}</p>}
              {carregando && <p>Carregando usuários...</p>}
              <Table
                key={chaveTabela}
                columns={columns}
                rows={rowsExibidos}
                rowIds={rowIds}
                selecionavel={rows.length > 0}
                onSelectionChange={setSelecionados}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Usuarios;