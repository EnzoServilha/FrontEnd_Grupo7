import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Filtro from "../components/Filtro";
import Header from "../components/Header";
import Input from "../components/Input";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Usuarios.module.css";

const placeholder = "---";

const tabs = [
  ["meu-usuario", "Meu usuário"],
  ["administrar", "Administrar Usuários"],
];

const camposBusca = [
  ["todos", "Todos os campos"],
  ["nome", "Nome"],
  ["email", "Email"],
  ["dataCadastro", "Data de cadastro"],
  ["cargo", "Cargo"],
  ["status", "Status"],
];

const statusDisponiveis = [
  ["todos", "Todos os status"],
  ["ativo", "Ativo"],
  ["desativo", "Desativo"],
];

const columns = [
  { name: "Nome", ordena: true, tipo: "string" },
  { name: "Data cadastro", ordena: true, tipo: "date" },
  { name: "Email", ordena: true, tipo: "string" },
  { name: "Cargo", ordena: true, tipo: "string" },
  { name: "Status", ordena: false, tipo: "string" },
];

// TODO: trocar por GET /usuarios quando o endpoint estiver pronto
// (formatar a data de cadastro como dd/mm/aaaa ao normalizar).
const USUARIOS_INICIAIS = [
  { id: 1, nome: "Admin", dataCadastro: "01/04/2026", email: "admin@teste.com", cargo: "ROLE_ADMIN", ativo: true },
  { id: 2, nome: "Maria", dataCadastro: "01/03/2026", email: "maria@teste.com", cargo: "ROLE_USER", ativo: true },
  { id: 3, nome: "João", dataCadastro: "01/04/2025", email: "joao@teste.com", cargo: "ROLE_USER", ativo: false },
];

const lerUsuarioLogado = () => {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado")) ?? null;
  } catch {
    return null;
  }
};

const normalizarUsuario = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome ?? placeholder,
  email: usuario.email ?? placeholder,
  dataCadastro: usuario.dataCadastro ?? placeholder,
  cargoRole: usuario.cargo,
  cargo: usuario.cargo === "ROLE_ADMIN" ? "Admin" : "Comum",
  status: usuario.ativo ? "Ativo" : "Desativo",
  statusClass: usuario.ativo ? "ativo" : "desativo",
});

function Usuarios() {
  const usuarioLogado = useMemo(lerUsuarioLogado, []);
  const isAdmin = usuarioLogado?.role === "ROLE_ADMIN";

  const [usuarios, setUsuarios] = useState(USUARIOS_INICIAIS);
  const [selecionados, setSelecionados] = useState([]);
  const [tabAtiva, setTabAtiva] = useState("meu-usuario");
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState("todos");
  const [statusFiltrado, setStatusFiltrado] = useState("todos");
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return usuarios.map(normalizarUsuario).filter((usuario) => {
      const correspondeAoStatus =
        statusFiltrado === "todos" || usuario.statusClass === statusFiltrado;

      if (!correspondeAoStatus) return false;
      if (!termo) return true;

      const valores =
        campoBusca === "todos"
          ? [usuario.nome, usuario.email, usuario.dataCadastro, usuario.cargo, usuario.status]
          : [usuario[campoBusca]];

      return valores.some((valor) =>
        String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo),
      );
    });
  }, [usuarios, busca, campoBusca, statusFiltrado]);

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

  // O admin logado não pode se desativar nem se rebaixar sem querer.
  const aplicarNosSelecionados = (alteracao) => {
    setUsuarios((lista) =>
      lista.map((usuario) =>
        selecionados.includes(usuario.id) && usuario.email !== usuarioLogado?.email
          ? { ...usuario, ...alteracao(usuario) }
          : usuario,
      ),
    );
    setSelecionados([]);
  };

  const alterarCargoSelecionados = (event) => {
    const novoCargo = event.target.value;
    if (!novoCargo || selecionados.length === 0) return;
    aplicarNosSelecionados(() => ({ cargo: novoCargo }));
  };

  const alternarStatusSelecionados = () => {
    if (selecionados.length === 0) return;
    // TODO: gerar aqui o log de desativação.
    aplicarNosSelecionados((usuario) => ({ ativo: !usuario.ativo }));
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
              {/* TODO: abrir a edição quando a tela existir */}
              <Button icone="editar" estilo="editar" onClick={() => { }}>
                Editar
              </Button>
            </div>

            <div className={styles.cardData}>
              <span>Nome: Adimin</span>
              <span>Email: teste@teste.com</span>
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
                    <div className={`${styles.popover} ${styles.filterPopover}`} role="menu">
                      {statusDisponiveis.map(([valor, label]) => (
                        <button
                          type="button"
                          role="menuitem"
                          key={valor}
                          className={statusFiltrado === valor ? styles.selectedOption : ""}
                          onClick={() => {
                            setStatusFiltrado(valor);
                            setFiltroAberto(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionControls}>
                <select
                  className={styles.statusSelect}
                  aria-label="Alterar cargo dos usuários selecionados"
                  value=""
                  onChange={alterarCargoSelecionados}
                >
                  <option value="" disabled>
                    Alterar Cargo
                  </option>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_USER">Comum</option>
                </select>

                <div className={styles.actionButtons}>
                  {/* TODO: abrir a edição quando a tela existir */}
                  <Button
                    icone="editar"
                    estilo="editar"
                    disabled={selecionados.length !== 1}
                    onClick={() => { }}
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
                  {/* TODO: abrir o cadastro quando a tela existir */}
                  <Button icone="adicionar" onClick={() => { }}>
                    Criar Usuário
                  </Button>
                </div>
              </div>
            </section>

            <section className={styles.tableSection} aria-label="Lista de usuários">
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
