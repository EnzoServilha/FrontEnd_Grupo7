import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Header from "../components/Header";
import Button from "../components/Button";
import ButtonMenor from "../components/ButtonMenor";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import Kpi from "../components/Kpi";
import Table from "../components/Table";
import SearchBar from "../components/SearchBar";
import CardGraficoPecas from "../components/CardGraficoPecas";
import { api } from "../provider/api";
import { solicitarEtiquetas } from "../provider/etiquetas";
import styles from "./VerMaisPecas.module.css";

const placeholder = "---";

const urlEstatisticasFornecedores = (itemId) =>
  `/movimentacoes/${itemId}/fornecedores-estatisticas`;

const camposCodigos = [
  ["todos", "Todos os campos"],
  ["codigo", "Código"],
  ["contato", "Cliente/Fornecedor"],
];

const camposFornecedores = [
  ["todos", "Todos os campos"],
  ["empresa", "Empresa"],
  ["localizacao", "Localização"],
];

const camposHistorico = [
  ["todos", "Todos os campos"],
  ["tipo", "Tipo"],
  ["status", "Status"],
  ["contato", "Contato"],
];

const camposSimilares = [
  ["todos", "Todos os campos"],
  ["codigo", "Código interno"],
  ["marca", "Marca"],
];

const extratoresCodigos = {
  codigo: (item) => item.codigo,
  contato: (item) => item.contato,
};

const extratoresFornecedores = {
  empresa: (item) => item.nomeEmpresa,
  localizacao: (item) => item.ufCidade,
};

const extratoresHistorico = {
  tipo: (item) => item.Tipo,
  status: (item) => item.Status,
  contato: (item) => item.Contato,
};

const extratoresSimilares = {
  codigo: (item) => item.codigoInterno,
  marca: (item) => item.marca,
};

const normalizarTexto = (valor) =>
  valor === null || valor === undefined || valor === "" ? placeholder : String(valor);

// Lê o dia direto da string para não perder um dia por causa do fuso horário
const formatarData = (valor) => {
  if (!valor) return placeholder;

  const encontrado = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (encontrado) return `${encontrado[3]}/${encontrado[2]}/${encontrado[1]}`;

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return normalizarTexto(valor);

  return data.toLocaleDateString("pt-BR");
};

const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return normalizarTexto(valor);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
};

const formatarPercentual = (valor) =>
  valor === null || valor === undefined
    ? placeholder
    : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const formatarDias = (valor) =>
  valor === null || valor === undefined
    ? placeholder
    : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;

const formatarTipo = (tipo) => {
  if (tipo === "ENTRADA") return "Entrada";
  if (tipo === "SAIDA") return "Saída";
  return tipo ? tipo : placeholder;
};

const listaOuVazia = (dados) => (Array.isArray(dados) ? dados : []);

const normalizarCodigo = (codigo) => {
  const fornecedor = codigo?.fornecedor ?? null;
  const cliente = codigo?.cliente ?? null;

  const nome = fornecedor
    ? (fornecedor.razaoSocial ?? fornecedor.nomeEmpresa ?? fornecedor.nome)
    : (cliente?.nome ?? cliente?.nomeEmpresa ?? cliente?.razaoSocial);

  return {
    id: codigo?.id,
    codigo: normalizarTexto(codigo?.codigo),
    contato: normalizarTexto(nome),
    tipoContato: fornecedor ? "fornecedor" : cliente ? "cliente" : null,
    contatoId: fornecedor?.id ?? cliente?.id ?? null,
  };
};

const nomeContatoMovimentacao = (movimentacao) =>
  movimentacao?.fornecedor?.razaoSocial ||
  movimentacao?.fornecedor?.nomeEmpresa ||
  movimentacao?.fornecedor?.nomeContato ||
  movimentacao?.cliente?.nome ||
  movimentacao?.cliente?.nomeEmpresa ||
  movimentacao?.cliente?.nomeContato ||
  placeholder;

// Cada registro é uma linha: esta peça dentro de uma movimentação
const normalizarRegistro = (registro) => {
  const movimentacao = registro?.movimentacaoEstoque ?? {};
  const tipoOriginal = String(movimentacao?.tipo?.nome ?? "").trim().toUpperCase();
  const quantidade = Number(registro?.qtd ?? 0);

  const unitario =
    registro?.precoUnitario === null || registro?.precoUnitario === undefined
      ? null
      : Number(registro.precoUnitario);
  const unitarioValido = Number.isFinite(unitario);

  return {
    id: registro?.id,
    movimentacaoId: movimentacao?.id ?? null,
    tipoOriginal,
    statusOriginal: String(movimentacao?.status?.nome ?? "").trim().toUpperCase(),
    Tipo: formatarTipo(tipoOriginal),
    Status: normalizarTexto(movimentacao?.status?.nome),
    Contato: nomeContatoMovimentacao(movimentacao),
    NotaFiscal: movimentacao?.numeroNotaFiscal || placeholder,
    quantidade,
    Unitario: formatarMoeda(unitarioValido ? unitario : null),
    Total: formatarMoeda(unitarioValido ? quantidade * unitario : null),
    DataPedido: formatarData(movimentacao?.dataMovimentacao),
    DataPrevista: formatarData(movimentacao?.dataEntregaPrevista),
    DataEntrega: formatarData(movimentacao?.dataEntrega),
  };
};

// Entradas somam, saídas subtraem. Cotações, ajustes e cancelados ficam de fora.
const calcularEstoque = (registros) =>
  registros.reduce((saldo, registro) => {
    if (registro.statusOriginal.includes("CANCEL")) return saldo;
    if (registro.tipoOriginal === "ENTRADA") return saldo + registro.quantidade;
    if (registro.tipoOriginal === "SAIDA") return saldo - registro.quantidade;
    return saldo;
  }, 0);

const filtrarPorTexto = (lista, { campo, busca }, extratores) => {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  if (!termo) return lista;

  return lista.filter((item) => {
    const valores =
      campo === "todos"
        ? Object.values(extratores).map((extrair) => extrair(item))
        : [extratores[campo]?.(item)];

    return valores.some((valor) =>
      String(valor ?? "").toLocaleLowerCase("pt-BR").includes(termo),
    );
  });
};

// Menu de "pesquisar por" + barra de pesquisa (sempre mostra o campo ativo)
function CampoPesquisa({
  id,
  campos,
  campo,
  onCampoChange,
  busca,
  onBuscaChange,
  aberto,
  onAlternar,
  size,
}) {
  const rotulo = campos.find(([valor]) => valor === campo)?.[1];

  return (
    <>
      <div className={styles.menuContainer}>
        <button
          type="button"
          className={styles.optionsButton}
          aria-label={`Pesquisar por: ${rotulo}`}
          aria-expanded={aberto}
          aria-controls={id}
          title={`Pesquisar por: ${rotulo}`}
          onClick={onAlternar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>

        {aberto && (
          <div id={id} className={styles.popover} role="menu">
            {campos.map(([valor, label]) => (
              <button
                type="button"
                role="menuitem"
                key={valor}
                className={campo === valor ? styles.selectedOption : ""}
                onClick={() => onCampoChange(valor)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <SearchBar
        campo={rotulo}
        size={size}
        placeholder="Pesquisar..."
        value={busca}
        onChange={(event) => onBuscaChange(event.target.value)}
        ariaLabel={`Pesquisar por ${rotulo}`}
      />
    </>
  );
}

function VerMaisPecas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [peca, setPeca] = useState(null);
  const [codigos, setCodigos] = useState([]);
  const [similares, setSimilares] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [estatisticas, setEstatisticas] = useState([]);
  const [precosMedios, setPrecosMedios] = useState({ compra: null, venda: null });
  const [carregando, setCarregando] = useState(true);
  const [campoBusca, setCampoBusca] = useState("todos");
  const [menuBuscaAberto, setMenuBuscaAberto] = useState(false);
  const [solicitandoEtiqueta, setSolicitandoEtiqueta] = useState(false);
  const [feedbackEtiqueta, setFeedbackEtiqueta] = useState(null);
  const [erroCarga, setErroCarga] = useState(false);

  const [menuAberto, setMenuAberto] = useState(null);
  const [pesquisas, setPesquisas] = useState({
    codigos: { campo: "todos", busca: "" },
    fornecedores: { campo: "todos", busca: "" },
    historico: { campo: "todos", busca: "" },
    similares: { campo: "todos", busca: "" },
  });
  const [tipoHistorico, setTipoHistorico] = useState("todos");
  const [selCodigos, setSelCodigos] = useState([]);
  const [selSimilares, setSelSimilares] = useState([]);
  const [modalExcluir, setModalExcluir] = useState(null); // "peca" | "codigos" | "similares"

  const gerarEtiqueta = () => {
    // TODO: integrar geração de etiqueta
  };

  const alternarMenu = (nome) =>
    setMenuAberto((atual) => (atual === nome ? null : nome));

  const atualizarPesquisa = (secao, parcial) =>
    setPesquisas((atuais) => ({
      ...atuais,
      [secao]: { ...atuais[secao], ...parcial },
    }));

  const propsPesquisa = (secao, campos) => ({
    id: `campos-busca-${secao}`,
    campos,
    campo: pesquisas[secao].campo,
    busca: pesquisas[secao].busca,
    onCampoChange: (campo) => {
      atualizarPesquisa(secao, { campo });
      setMenuAberto(null);
    },
    onBuscaChange: (busca) => atualizarPesquisa(secao, { busca }),
    aberto: menuAberto === secao,
    onAlternar: () => alternarMenu(secao),
  });

  useEffect(() => {
    const itemSelecionado = location.state?.peca ?? location.state?.item ?? null;
    const itemIdFromState = itemSelecionado?.id ?? location.state?.id ?? location.state?.itemId;
    const itemId = Number(itemIdFromState ?? new URLSearchParams(location.search).get("id"));

    if (!Number.isFinite(itemId) || itemId <= 0) {
      setCarregando(false);
      return;
    }

    const carregarDetalhes = async () => {
      try {
        setCarregando(true);
        setErroCarga(false);

        // Preços, similares e estatísticas são opcionais: se falharem, a página abre mesmo assim
        const opcional = (requisicao, padrao, nome) =>
          requisicao
            .then((resposta) => resposta.data)
            .catch((erro) => {
              console.error(`Falha em ${nome}:`, erro?.response?.status, erro?.response?.data ?? erro);
              return padrao;
            });

        const [respostaItem, respostaHistorico, precos, listaSimilares, listaEstatisticas] =
          await Promise.all([
            api.get(`/itens/${itemId}`),
            api.get(`/itensNaMovimentacao/item/${itemId}`),
            opcional(api.get(`/itens/${itemId}/precos-medios`), null, "preços médios"),
            opcional(api.get(`/itens/${itemId}/similares`), [], "similares"),
            opcional(api.get(urlEstatisticasFornecedores(itemId)), [], "estatísticas de fornecedores"),
          ]);

        const item = respostaItem.data ?? {};

        setPeca({
          id: item.id ?? itemId,
          codigoInterno: normalizarTexto(item.codigoInterno),
          marca: normalizarTexto(item.marca),
          anoFabricacao: normalizarTexto(item.ano ?? item.anoFabricacao),
          localizacao: normalizarTexto(item.localizacao),
          dataCadastro: formatarData(item.dataCadastro),
          descricao: normalizarTexto(item.descricao),
        });

        setCodigos(listaOuVazia(item.codigosAssociados).map(normalizarCodigo));

        const similaresBrutos = listaOuVazia(listaSimilares).length
          ? listaSimilares
          : item.itensSimilares;
        setSimilares(
          listaOuVazia(similaresBrutos).map((similar) => ({
            id: similar?.id,
            codigoInterno: normalizarTexto(similar?.codigoInterno),
            marca: normalizarTexto(similar?.marca),
          })),
        );

        setHistorico(listaOuVazia(respostaHistorico.data).map(normalizarRegistro));
        setPrecosMedios({
          compra: precos?.precoMedioCompra ?? null,
          venda: precos?.precoMedioVenda ?? null,
        });
        setEstatisticas(listaOuVazia(listaEstatisticas));
        setSelCodigos([]);
        setSelSimilares([]);
      } catch (error) {
        console.error("Erro ao buscar detalhes da peça:", error);
        setErroCarga(true);
        setPeca({
          id: itemId,
          codigoInterno: placeholder,
          marca: placeholder,
          anoFabricacao: placeholder,
          localizacao: placeholder,
          dataCadastro: placeholder,
          descricao: placeholder,
        });
        setCodigos([]);
        setSimilares([]);
        setHistorico([]);
        setEstatisticas([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDetalhes();
  }, [location.search, location.state]);

  const estoque = useMemo(() => calcularEstoque(historico), [historico]);
  const textoEstoque = erroCarga
    ? placeholder
    : `${estoque.toLocaleString("pt-BR")} unidades`;

  const itemParaNavegacao = { id: peca?.id, codigoInterno: peca?.codigoInterno };

  const editarPeca = () => {
    if (!peca?.id) return;
    navigate("/cadastrarPeca", {
      state: { item: { id: peca.id }, modoEdicao: true },
    });
  };

  const editarCodigoSelecionado = () => {
    const codigo = codigos.find((item) => item.id === selCodigos[0]);
    if (!codigo) return;
    navigate("/associarCodigo", { state: { item: itemParaNavegacao, codigo } });
  };

  // Abre o pedido (movimentação) ao qual o registro do histórico pertence
  const abrirPedido = (registro) => {
    if (!registro.movimentacaoId) return;
    navigate(`/verMaisPedido?id=${registro.movimentacaoId}`, {
      state: {
        id: registro.movimentacaoId,
        pedido: { id: registro.movimentacaoId },
      },
    });
  };

  const removerVinculos = async (ids, montarUrl) => {
    const resultados = await Promise.allSettled(
      ids.map((id) => api.delete(montarUrl(id))),
    );
    const removidos = new Set(
      ids.filter((_, indice) => resultados[indice].status === "fulfilled"),
    );
    if (removidos.size < ids.length) {
      alert("Alguns itens não puderam ser removidos.");
    }
    return removidos;
  };

  const confirmarExclusao = async () => {
    try {
      if (modalExcluir === "peca") {
        await api.patch(`/itens/${peca.id}/desativacao`);
        navigate("/pecas");
        return;
      }

      if (modalExcluir === "codigos") {
        const removidos = await removerVinculos(
          selCodigos,
          (id) => `/itens/${peca.id}/codigos-associados/${id}`,
        );
        setCodigos((atuais) => atuais.filter((item) => !removidos.has(item.id)));
        setSelCodigos([]);
      }

      if (modalExcluir === "similares") {
        const removidos = await removerVinculos(
          selSimilares,
          (id) => `/itens/${peca.id}/similares/${id}`,
        );
        setSimilares((atuais) => atuais.filter((item) => !removidos.has(item.id)));
        setSelSimilares([]);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert(error?.response?.data?.message || "Não foi possível concluir a exclusão.");
    } finally {
      setModalExcluir(null);
    }
  };

  const codigosFiltrados = useMemo(
    () => filtrarPorTexto(codigos, pesquisas.codigos, extratoresCodigos),
    [codigos, pesquisas.codigos],
  );

  const similaresFiltrados = useMemo(
    () => filtrarPorTexto(similares, pesquisas.similares, extratoresSimilares),
    [similares, pesquisas.similares],
  );

  const estatisticasFiltradas = useMemo(
    () => filtrarPorTexto(estatisticas, pesquisas.fornecedores, extratoresFornecedores),
    [estatisticas, pesquisas.fornecedores],
  );

  const historicoFiltrado = useMemo(
    () =>
      filtrarPorTexto(
        historico.filter(
          (registro) => tipoHistorico === "todos" || registro.tipoOriginal === tipoHistorico,
        ),
        pesquisas.historico,
        extratoresHistorico,
      ),
    [historico, tipoHistorico, pesquisas.historico],
  );

  const columnsCodigos = [
    { name: "Código item", ordena: true, tipo: "string" },
    { name: "Cliente/Fornecedor", ordena: true, tipo: "string" },
  ];

  const rowsCodigos = codigosFiltrados.map((codigo) => ({
    id: codigo.id,
    cells: [codigo.codigo, codigo.contato],
  }));

  // A coluna "Tipo" vira link para o pedido, então não ordena (célula com JSX)
  const columnsHistorico = [
    { name: "Tipo", ordena: false, tipo: "string" },
    { name: "Status", ordena: true, tipo: "string" },
    { name: "Contato", ordena: true, tipo: "string" },
    { name: "Nº Nota Fiscal", ordena: true, tipo: "string" },
    { name: "Quantidade", ordena: true, tipo: "number" },
    { name: "Preço Unitário", ordena: true, tipo: "number" },
    { name: "Preço Total", ordena: true, tipo: "number" },
    { name: "Data do Pedido", ordena: true, tipo: "date" },
    { name: "Data Prevista", ordena: true, tipo: "date" },
    { name: "Data da Entrega", ordena: true, tipo: "date" },
  ];

  const rowsHistorico = historicoFiltrado.map((registro) => ({
    id: registro.id,
    cells: [
      <button
        type="button"
        className={styles.tableLink}
        title="Abrir pedido"
        disabled={!registro.movimentacaoId}
        onClick={() => abrirPedido(registro)}
      >
        {registro.Tipo}
      </button>,
      registro.Status,
      registro.Contato,
      registro.NotaFiscal,
      registro.quantidade.toLocaleString("pt-BR"),
      registro.Unitario,
      registro.Total,
      registro.DataPedido,
      registro.DataPrevista,
      registro.DataEntrega,
    ],
  }));

  const columnsSimilares = [
    { name: "Código Interno Item", ordena: true, tipo: "string" },
    { name: "Marca", ordena: true, tipo: "string" },
  ];

  const rowsSimilares = similaresFiltrados.map((similar) => ({
    id: similar.id,
    cells: [similar.codigoInterno, similar.marca],
  }));

  const voltar = () => navigate(-1);

  const gerarEtiqueta = async () => {
    if (!peca?.id || solicitandoEtiqueta) return;

    setSolicitandoEtiqueta(true);
    setFeedbackEtiqueta(null);

    try {
      setFeedbackEtiqueta(await solicitarEtiquetas([peca.id]));
    } finally {
      setSolicitandoEtiqueta(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.content}>
        <div className={styles.headerPeca}>
          <div className={styles.titleGroup}>
            <button type="button" onClick={voltar} className={styles.backButton} aria-label="Voltar">
              <svg
                className={styles.backIcon}
                xmlns="http://www.w3.org/2000/svg"
                height="28px"
                viewBox="0 -960 960 960"
                width="28px"
                fill="#0f172a"
              >
                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
              </svg>
            </button>
            <h1>Detalhes da Peça</h1>
          </div>

          <div className={styles.actionButtons}>
            <Button
              estilo="editar"
              disabled={carregando || solicitandoEtiqueta || !peca?.id}
              onClick={gerarEtiqueta}
            >
              {solicitandoEtiqueta ? "Enviando..." : "Gerar Etiqueta"}
            </Button>
            <Button icone="editar" estilo="editar">
              Editar
            </Button>
            <Button
              icone="deletar"
              estilo="deletar"
              disabled={!peca?.id}
              onClick={() => setModalExcluir("peca")}
            >
              Deletar
            </Button>
          </div>
        </div>

        {feedbackEtiqueta && (
          <p
            role={feedbackEtiqueta.tipo === "erro" ? "alert" : "status"}
            className={`${styles.feedback} ${
              feedbackEtiqueta.tipo === "erro"
                ? styles.feedbackErro
                : styles.feedbackSucesso
            }`}
          >
            {feedbackEtiqueta.mensagem}
          </p>
        )}

        <div className={styles.topGrid}>
          <div className={styles.leftTopColumn}>
            <section className={styles.cardInfo}>
              {carregando ? (
                <p>Carregando peça...</p>
              ) : (
                <>
                  <div className={styles.infoGrid}>
                    <div>
                      <strong>Código Interno:</strong>
                      <p>{peca?.codigoInterno}</p>
                    </div>
                    <div>
                      <strong>Marca:</strong>
                      <p>{peca?.marca}</p>
                    </div>
                    <div>
                      <strong>Ano de Fabricação:</strong>
                      <p>{peca?.anoFabricacao}</p>
                    </div>
                    <div>
                      <strong>Localização:</strong>
                      <p>{peca?.localizacao}</p>
                    </div>
                    <div>
                      <strong>Quantidade em Estoque:</strong>
                      <p>{textoEstoque}</p>
                    </div>
                    <div>
                      <strong>Data de Cadastro:</strong>
                      <p>{peca?.dataCadastro}</p>
                    </div>
                  </div>
                  <div className={styles.descriptionBlock}>
                    <strong>Descrição:</strong>
                    <p>{peca?.descricao}</p>
                  </div>

                  <div className={styles.kpiPricesRow}>
                    <Kpi
                      title="Preço Médio de Compra"
                      value={formatarMoeda(precosMedios.compra)}
                    />
                    <Kpi
                      title="Preço Médio de Venda"
                      value={formatarMoeda(precosMedios.venda)}
                    />
                  </div>
                </>
              )}
            </section>

            <section className={styles.cardCodigos}>
              <div className={styles.btnRow}>
                <h3>Códigos Associados</h3>
                <ButtonMenor
                  estilo="adicionar"
                  onClick={() =>
                    navigate("/associarCodigo", { state: { item: itemParaNavegacao } })
                  }
                >
                  + Adicionar
                </ButtonMenor>
                <ButtonMenor
                  icone="editar"
                  estilo="editar"
                  disabled={selCodigos.length !== 1}
                  onClick={editarCodigoSelecionado}
                >
                  Editar
                </ButtonMenor>
                <ButtonMenor
                  icone="deletar"
                  estilo="deletar"
                  disabled={selCodigos.length === 0}
                  onClick={() => {
                    if (selCodigos.length > 0) setModalExcluir("codigos");
                  }}
                >
                  Deletar
                </ButtonMenor>
              </div>

              <div className={styles.searchLinha}>
                <CampoPesquisa {...propsPesquisa("codigos", camposCodigos)} size="320px" />
              </div>

              <div className={styles.tableWrapper}>
                {rowsCodigos.length > 0 ? (
                  <Table
                    columns={columnsCodigos}
                    rows={rowsCodigos}
                    onSelectionChange={setSelCodigos}
                  />
                ) : (
                  <p className={styles.emptyState}>Nenhum código associado encontrado.</p>
                )}
              </div>
            </section>
          </div>

          <section className={styles.suppliersCard}>
            <div className={styles.searchHeader}>
              <CampoPesquisa {...propsPesquisa("fornecedores", camposFornecedores)} size="320px" />
            </div>
            <div className={styles.chartContainer}>
              {estatisticasFiltradas.length > 0 ? (
                estatisticasFiltradas.map((fornecedor, indice) => (
                  <div
                    key={fornecedor.fornecedorId ?? `${fornecedor.nomeEmpresa}-${indice}`}
                    className={styles.chartWrapper}
                  >
                    <CardGraficoPecas
                      supplierName={normalizarTexto(fornecedor.nomeEmpresa)}
                      location={normalizarTexto(fornecedor.ufCidade)}
                      kpis={{
                        onTimeDelivery: formatarPercentual(fornecedor.percentualEntregasNoPrazo),
                        medianDeliveryTime: formatarDias(fornecedor.medianaTempoEntregaDias),
                      }}
                    />
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>
                  Nenhum fornecedor com histórico para esta peça.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.bottomGrid}>
          <section className={styles.cardBottom}>
            <div className={styles.sectionHeader}>
              <h2>Histórico de Vendas e Compras</h2>
              <div className={styles.filterGroup}>
                <CampoPesquisa {...propsPesquisa("historico", camposHistorico)} size="500px" />

                <div className={styles.menuContainer}>
                  <Filtro
                    ariaLabel="Filtrar histórico por tipo"
                    onClick={() => alternarMenu("filtroHistorico")}
                  />

                  {menuAberto === "filtroHistorico" && (
                    <div
                      className={styles.popover}
                      style={{ right: 0, left: "auto" }}
                      role="menu"
                    >
                      {[
                        ["todos", "Todos os tipos"],
                        ["ENTRADA", "Entradas"],
                        ["SAIDA", "Saídas"],
                      ].map(([valor, label]) => (
                        <button
                          type="button"
                          role="menuitem"
                          key={valor}
                          className={tipoHistorico === valor ? styles.selectedOption : ""}
                          onClick={() => {
                            setTipoHistorico(valor);
                            setMenuAberto(null);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {rowsHistorico.length > 0 ? (
              <div className={styles.historicoScroll}>
                <Table
                  columns={columnsHistorico}
                  rows={rowsHistorico}
                  selecionavel={false}
                  removerNaOrdenacao="R$"
                />
              </div>
            ) : (
              <p className={styles.emptyState}>
                Nenhum histórico de compras ou vendas encontrado para esta peça.
              </p>
            )}
          </section>

          <section className={`${styles.cardBottom} ${styles.cardSimilares}`}>
            <div className={styles.sectionHeader}>
              <h2>Peças Similares</h2>
              <div className={styles.filterGroup}>
                <CampoPesquisa {...propsPesquisa("similares", camposSimilares)} size="320px" />
                <ButtonMenor
                  estilo="adicionar"
                  onClick={() =>
                    navigate("/assimilarPecas", { state: { item: itemParaNavegacao } })
                  }
                >
                  + Adicionar
                </ButtonMenor>
                <ButtonMenor
                  icone="deletar"
                  estilo="deletar"
                  disabled={selSimilares.length === 0}
                  onClick={() => {
                    if (selSimilares.length > 0) setModalExcluir("similares");
                  }}
                >
                  Deletar
                </ButtonMenor>
              </div>
            </div>

            {rowsSimilares.length > 0 ? (
              <div className={styles.similaresScroll}>
                <Table
                  columns={columnsSimilares}
                  rows={rowsSimilares}
                  onSelectionChange={setSelSimilares}
                />
              </div>
            ) : (
              <p className={styles.emptyState}>Nenhuma peça similar encontrada.</p>
            )}
          </section>
        </div>
      </main>

      <DeleteModal
        isOpen={modalExcluir !== null}
        onClose={() => setModalExcluir(null)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}

export default VerMaisPecas;