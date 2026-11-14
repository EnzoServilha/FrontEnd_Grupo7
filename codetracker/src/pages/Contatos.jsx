import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Header from "../components/Header";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./Contatos.module.css";

const TAMANHO_CARGA = 1000;
const ATRASO_BUSCA_MS = 400;

// As chaves são os nomes dos parâmetros de /fornecedores/buscar e /clientes/buscar
const camposBuscaFornecedores = [
  ["nomeEmpresa", "Nome empresa"],
  ["nomeContato", "Nome contato"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["localizacao", "Localização"],
];

const camposBuscaClientes = [
  ["nomeEmpresa", "Empresa"],
  ["nomeContato", "Contato"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["localizacao", "Localização"],
];

const FILTROS_VAZIOS = { fabricantes: [], categorias: [] };

const filtrosAtivos = (f) => f.fabricantes.length > 0 || f.categorias.length > 0;

const resumoFiltros = (f) => {
  const partes = [];
  if (f.fabricantes.length) partes.push(`Fabricantes: ${f.fabricantes.join(", ")}`);
  if (f.categorias.length) partes.push(`Categorias: ${f.categorias.join(", ")}`);
  return partes.join(" · ");
};

const nomesUnicos = (lista) =>
  [...new Set(lista)].sort((a, b) => a.localeCompare(b, "pt-BR"));

const formatarLocalizacao = (endereco) => {
  if (!endereco) return "Não informada";

  const uf = endereco.uf || "--";
  const cidade = endereco.cidade || "Não informada";

  return `${uf} - ${cidade}`;
};

const extrairNomes = (lista) => {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item) => (typeof item === "string" ? item : item?.nome))
    .filter(Boolean);
};

const normalizarFornecedor = (fornecedor) => ({
  id: fornecedor.id,
  empresa: fornecedor.nomeEmpresa || "Não informado",
  contato: fornecedor.nomeContato || "Não informado",
  localizacao: formatarLocalizacao(fornecedor.endereco),
  telefone: fornecedor.telefone || "Não informado",
  email: fornecedor.email || "Não informado",
  categorias: extrairNomes(fornecedor.categoria),
  fabricantes: extrairNomes(fornecedor.marcas),
});

const normalizarCliente = (cliente) => ({
  id: cliente.id,
  empresa: cliente.nomeEmpresa || "Não informado",
  contato: cliente.nomeContato || "Não informado",
  localizacao: formatarLocalizacao(cliente.endereco),
  telefone: cliente.telefone || "Não informado",
  email: cliente.email || "Não informado",
  categorias: [],
  fabricantes: [],
});

const extrairClientes = (dados) => {
  const lista = Array.isArray(dados) ? dados : (dados?.conteudo ?? []);

  return lista.flatMap((item) => {
    if (Array.isArray(item?.conteudo) && item.conteudo.length > 0) {
      return item.conteudo;
    }
    return item?.id != null ? [item] : [];
  });
};

async function buscarFornecedores({ termo, campo, filtros }) {
  // Sem pesquisa e sem filtro: lista completa
  if (!termo && !filtrosAtivos(filtros)) {
    const resposta = await api.get("/fornecedores");
    return (Array.isArray(resposta.data) ? resposta.data : []).map(normalizarFornecedor);
  }

  // URLSearchParams repete a chave (fabricantes=a&fabricantes=b), que é o que o
  // Spring espera para List<String>. O axios sozinho enviaria fabricantes[]=a.
  const params = new URLSearchParams();
  if (termo) params.append(campo, termo);
  filtros.fabricantes.forEach((nome) => params.append("fabricantes", nome));
  filtros.categorias.forEach((nome) => params.append("categorias", nome));

  const resposta = await api.get("/fornecedores/buscar", { params });
  return (Array.isArray(resposta.data) ? resposta.data : []).map(normalizarFornecedor);
}

async function buscarClientes({ termo, campo }) {
  // /clientes é paginado no back (10 por padrão): pedimos tudo de uma vez
  if (!termo) {
    const resposta = await api.get("/clientes", {
      params: { pagina: 0, tamanho: TAMANHO_CARGA },
    });
    return extrairClientes(resposta.data).map(normalizarCliente);
  }

  const resposta = await api.get("/clientes/buscar", { params: { [campo]: termo } });
  return extrairClientes(resposta.data).map(normalizarCliente);
}

function Contatos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tipoAtivo, setTipoAtivo] = useState(
    location.state?.tipoAtivo || "fornecedores",
  );
  const isCliente = tipoAtivo === "clientes";
  const rotaDetalhes = isCliente ? "/verMaisCliente" : "/verMaisFornecedor";

  const [contatosPorTipo, setContatosPorTipo] = useState({
    fornecedores: [],
    clientes: [],
  });

  const contatosAtivos = useMemo(
    () => contatosPorTipo[tipoAtivo] || [],
    [contatosPorTipo, tipoAtivo],
  );

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [campoBusca, setCampoBusca] = useState("nomeEmpresa");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [rascunhoFiltros, setRascunhoFiltros] = useState(FILTROS_VAZIOS);
  const [opcoesFiltro, setOpcoesFiltro] = useState({ categorias: [], fabricantes: [] });
  const [selecionados, setSelecionados] = useState([]);
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const termoBusca = buscaAplicada.trim();
  // Sem termo, o campo de busca não muda a consulta
  const campoConsulta = termoBusca ? campoBusca : "nomeEmpresa";
  // Clientes não têm filtro
  const filtrosConsulta = isCliente ? FILTROS_VAZIOS : filtros;

  // Espera o usuário parar de digitar antes de consultar o back
  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;

    const carregarContatos = async () => {
      try {
        setCarregando(true);

        const lista = isCliente
          ? await buscarClientes({ termo: termoBusca, campo: campoConsulta })
          : await buscarFornecedores({
            termo: termoBusca,
            campo: campoConsulta,
            filtros: filtrosConsulta,
          });

        // Ignora respostas antigas se a consulta mudou no meio do caminho
        if (cancelado) return;

        setContatosPorTipo((atuais) => ({ ...atuais, [tipoAtivo]: lista }));

        // As opções do filtro vêm da carga completa (sem pesquisa e sem filtro),
        // senão elas encolheriam junto com o resultado.
        if (!isCliente && !termoBusca && !filtrosAtivos(filtrosConsulta)) {
          setOpcoesFiltro({
            categorias: nomesUnicos(lista.flatMap((contato) => contato.categorias)),
            fabricantes: nomesUnicos(lista.flatMap((contato) => contato.fabricantes)),
          });
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        if (!cancelado) {
          setContatosPorTipo((atuais) => ({ ...atuais, [tipoAtivo]: [] }));
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    carregarContatos();

    return () => {
      cancelado = true;
    };
  }, [tipoAtivo, isCliente, termoBusca, campoConsulta, filtrosConsulta]);

  const trocarTipo = (tipo) => {
    setTipoAtivo(tipo);
    setSelecionados([]);
    setBusca("");
    setBuscaAplicada("");
    setFiltros(FILTROS_VAZIOS);
    setRascunhoFiltros(FILTROS_VAZIOS);
    setFiltroAberto(false);
    setMenuBuscaAberto(false);
  };

  const alternarFiltro = () => {
    setFiltroAberto((aberto) => {
      if (!aberto) setRascunhoFiltros(filtros);
      return !aberto;
    });
    setMenuBuscaAberto(false);
  };

  const alternarOpcao = (grupo, nome) =>
    setRascunhoFiltros((atual) => ({
      ...atual,
      [grupo]: atual[grupo].includes(nome)
        ? atual[grupo].filter((item) => item !== nome)
        : [...atual[grupo], nome],
    }));

  const aplicarFiltros = () => {
    setFiltros(rascunhoFiltros);
    setSelecionados([]);
    setFiltroAberto(false);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setRascunhoFiltros(FILTROS_VAZIOS);
    setSelecionados([]);
    setFiltroAberto(false);
  };

  const camposBuscaAtual = isCliente
    ? camposBuscaClientes
    : camposBuscaFornecedores;

  const abrirDetalhes = (contato) => {
    navigate(rotaDetalhes, { state: { contato } });
  };

  const excluirSelecionados = async () => {
    if (selecionados.length === 0) {
      setModalExcluirAberto(false);
      return;
    }

    try {
      const rota = isCliente ? "/clientes" : "/fornecedores";

      await Promise.all(
        selecionados.map((id) => api.patch(`${rota}/${id}/desativacao`)),
      );

      const idsSelecionados = new Set(selecionados);

      setContatosPorTipo((dadosAtuais) => ({
        ...dadosAtuais,
        [tipoAtivo]: (dadosAtuais[tipoAtivo] || []).filter(
          (contato) => !idsSelecionados.has(contato.id),
        ),
      }));

      setSelecionados([]);
    } catch (error) {
      console.error("Erro ao desativar contatos:", error);
      alert(
        error?.response?.data?.message ||
        "Não foi possível desativar o(s) contato(s) selecionado(s).",
      );
    } finally {
      setModalExcluirAberto(false);
    }
  };

  const editarSelecionado = () => {
    const contato = contatosAtivos.find((item) => item.id === selecionados[0]);

    if (!contato) return;

    if (isCliente) {
      navigate("/cadastrarCliente", {
        state: {
          clienteId: contato.id,
        },
      });
      return;
    }

    navigate("/cadastrarFornecedor", {
      state: {
        fornecedorId: contato.id,
      },
    });
  };

  const columns = [
    { name: "Empresa", ordena: false, tipo: "string" },
    { name: "Contato", ordena: true, tipo: "string" },
    { name: "Telefone", ordena: false, tipo: "string" },
    { name: "E-mail", ordena: true, tipo: "string" },
    { name: "Localização", ordena: true, tipo: "string" },
    ...(!isCliente
      ? [
        { name: "Categorias", ordena: true, tipo: "string" },
        { name: "Fabricantes", ordena: true, tipo: "string" },
      ]
      : []),
  ];

  const rows = contatosAtivos.map((contato) => ({
    id: contato.id,
    cells: [
      <button
        type="button"
        className={styles.tableLink}
        onClick={() => abrirDetalhes(contato)}
      >
        {contato.empresa}
      </button>,
      contato.contato,
      contato.telefone,
      contato.email,
      contato.localizacao,
      ...(!isCliente
        ? [contato.categorias.join(", "), contato.fabricantes.join(", ")]
        : []),
    ],
  }));

  const campoBuscaAtivo = camposBuscaAtual.find(
    ([valor]) => valor === campoBusca,
  )?.[1];

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.tabs} role="tablist" aria-label="Tipo de contato">
          <button
            type="button"
            role="tab"
            aria-selected={tipoAtivo === "fornecedores"}
            className={tipoAtivo === "fornecedores" ? styles.activeTab : ""}
            onClick={() => trocarTipo("fornecedores")}
          >
            Fornecedores
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipoAtivo === "clientes"}
            className={tipoAtivo === "clientes" ? styles.activeTab : ""}
            onClick={() => trocarTipo("clientes")}
          >
            Clientes
          </button>
        </div>

        <section className={styles.toolbar} aria-label="Ações dos contatos">
          <div className={styles.searchActions}>
            <div className={styles.menuContainer}>
              <button
                type="button"
                className={styles.optionsButton}
                aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                aria-expanded={menuBuscaAberto}
                aria-controls="campos-busca-contatos"
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
                <div
                  id="campos-busca-contatos"
                  className={styles.popover}
                  role="menu"
                >
                  {camposBuscaAtual.map(([valor, label]) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={valor}
                      className={
                        campoBusca === valor ? styles.selectedOption : ""
                      }
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
                placeholder="Buscar contatos..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                ariaLabel="Buscar contatos"
              />
            </div>

            {/* Só fornecedores têm filtro */}
            {!isCliente && (
              <div className={styles.menuContainer}>
                <Filtro ariaLabel="Filtrar fornecedores" onClick={alternarFiltro} />

                {filtroAberto && (
                  <div
                    className={`${styles.popover} ${styles.filterPopover} ${styles.filterPanel}`}
                    role="dialog"
                    aria-label="Filtros de fornecedores"
                  >
                    <fieldset className={styles.filterGroup}>
                      <legend>Fabricantes</legend>
                      <div className={styles.optionList}>
                        {opcoesFiltro.fabricantes.length === 0 && (
                          <span className={styles.filterHint}>
                            Nenhum fabricante disponível
                          </span>
                        )}
                        {opcoesFiltro.fabricantes.map((nome) => (
                          <label key={nome} className={styles.checkOption}>
                            <input
                              type="checkbox"
                              checked={rascunhoFiltros.fabricantes.includes(nome)}
                              onChange={() => alternarOpcao("fabricantes", nome)}
                            />
                            {nome}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className={styles.filterGroup}>
                      <legend>Categorias</legend>
                      <div className={styles.optionList}>
                        {opcoesFiltro.categorias.length === 0 && (
                          <span className={styles.filterHint}>
                            Nenhuma categoria disponível
                          </span>
                        )}
                        {opcoesFiltro.categorias.map((nome) => (
                          <label key={nome} className={styles.checkOption}>
                            <input
                              type="checkbox"
                              checked={rascunhoFiltros.categorias.includes(nome)}
                              onChange={() => alternarOpcao("categorias", nome)}
                            />
                            {nome}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className={styles.filterActions}>
                      <button
                        type="button"
                        className={styles.clearButton}
                        onClick={limparFiltros}
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        className={styles.applyButton}
                        onClick={aplicarFiltros}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <Button
              icone="adicionar"
              onClick={() =>
                navigate(isCliente ? "/cadastrarCliente" : "/cadastrarFornecedor")
              }
            >
              Adicionar Contato
            </Button>
            <Button
              icone="editar"
              estilo="editar"
              disabled={selecionados.length !== 1}
              onClick={editarSelecionado}
            >
              Editar
            </Button>
            <Button
              icone="deletar"
              estilo="deletar"
              disabled={selecionados.length === 0}
              onClick={() => {
                if (selecionados.length > 0) setModalExcluirAberto(true);
              }}
            >
              Deletar
            </Button>
          </div>
        </section>

        {!isCliente && filtrosAtivos(filtros) && (
          <div className={styles.activeFilters}>
            <span>{resumoFiltros(filtros)}</span>
            <button type="button" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        )}

        <section
          className={styles.tableSection}
          aria-label={isCliente ? "Clientes" : "Fornecedores"}
        >
          <Table
            key={tipoAtivo}
            columns={columns}
            rows={rows}
            onSelectionChange={setSelecionados}
          />

          {carregando && (
            <p className={styles.tableMessage}>Carregando contatos...</p>
          )}
          {!carregando && rows.length === 0 && (
            <p className={styles.tableMessage}>Nenhum contato encontrado.</p>
          )}
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={excluirSelecionados}
      />
    </div>
  );
}

export default Contatos;