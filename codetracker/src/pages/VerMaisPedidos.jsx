import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import ButtonMenor from "../components/ButtonMenor";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import { api } from "../provider/api";
import styles from "./VerMaisPedidos.module.css";

const placeholder = "---";

const normalizarTexto = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;
  else if (valor === "SAIDA") return 'Saída';
  return String(valor);
};

const formatarData = (valor) => {
  if (!valor) return placeholder;
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

// Remove acentos e deixa minúsculo para comparar nomes de tipo/status
const semAcento = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const ehSaida = (mov) => semAcento(mov?.tipo?.nome).includes("saida");
const ehCotacao = (mov) => semAcento(mov?.tipo?.nome).includes("cota");
const estaConcluida = (mov) => semAcento(mov?.status?.nome).includes("conclu");

const obterTituloItens = (mov) => {
  if (ehSaida(mov)) return "Itens da Saída";
  if (ehCotacao(mov)) return "Itens da Cotação";
  return "Itens do Pedido";
};

const columns = [
  { name: "Código Interno", ordena: false, tipo: "string" },
  { name: "Preço Total", ordena: true, tipo: "number" },
  { name: "Preço Unitário", ordena: true, tipo: "number" },
  { name: "Qtd. Itens", ordena: true, tipo: "number" },
];

/* ---------- Chamadas à API (cada uma trata o próprio erro) ---------- */

const buscarMovimentacao = async (id) => {
  try {
    const resposta = await api.get(`/movimentacoes/${id}`);
    return resposta.data ?? null;
  } catch (error) {
    console.error("Erro ao buscar movimentação:", error);
    return null;
  }
};

const buscarItens = async (id) => {
  try {
    const resposta = await api.get(`/itensNaMovimentacao/movimentacao/${id}`);
    return Array.isArray(resposta.data) ? resposta.data : [];
  } catch (error) {
    console.error("Erro ao buscar itens da movimentação:", error);
    return [];
  }
};

// ASSUNÇÃO: a saída gerada nasce no mesmo período da cotação, então procuro
// nas movimentações desse período aquela cuja movimentacaoOriginalId é o id
// da cotação. Se existir um endpoint dedicado (ex.: /movimentacoes/original/{id}),
// basta trocar o corpo desta função.
const buscarSaidaAssociada = async (cotacao) => {
  const periodoId = cotacao?.periodo?.id;
  if (!periodoId) return null;

  try {
    const resposta = await api.get(`/movimentacoes/periodo/${periodoId}`);
    console.log("Movimentações do período:", resposta.data);
    const lista = Array.isArray(resposta.data) ? resposta.data : [];
    console.log("Movimentações do período:", lista);
    return (
      lista.find(
        (mov) =>
          ehSaida(mov) &&
          Number(mov.movimentacaoOriginalId) === Number(cotacao.id),
      ) ?? null
    );
  } catch (error) {
    console.error("Erro ao buscar saída associada:", error);
    return null;
  }
};

/* ---------- Seção reutilizável: título + busca + tabela de itens ---------- */

function TabelaItens({
  titulo,
  itens,
  carregando,
  textoBotao,
  onClickBotao,
}) {
  const [busca, setBusca] = useState("");

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
        const precoTotal = qtd * precoUnitario;

        return {
          id: registro?.id ?? idx,
          cells: [
            normalizarTexto(registro?.item?.codigoInterno),
            formatarMoeda(precoTotal),
            formatarMoeda(precoUnitario),
            qtd,
          ],
        };
      });
  }, [busca, itens]);

  return (
    <section className={styles.tableSection}>
      <div className={styles.sectionHeader}>
        <h2>{titulo}</h2>
        <div className={styles.filterControls}>
          <SearchBar
            placeholder="Digite para procurar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            ariaLabel={`Buscar em ${titulo}`}
          />
          <Filtro ariaLabel={`Filtrar ${titulo}`} onClick={() => { }} />
          {textoBotao && (
            <ButtonMenor estilo="editar" onClick={onClickBotao}>
              {textoBotao}
            </ButtonMenor>
          )}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <Table
          key={`${carregando}-${itens.map((i) => i.id).join(",")}`}
          columns={columns}
          rows={
            carregando
              ? [[placeholder, placeholder, placeholder, placeholder]]
              : rows
          }
          removerNaOrdenacao="R$"
        />
      </div>
    </section>
  );
}

/* ---------- Página ---------- */

export default function VerMaisPedidos() {
  const navigate = useNavigate();
  const location = useLocation();
  const pedidoBase = location.state?.pedido ?? null;

  const [movimentacao, setMovimentacao] = useState(null);
  const [itensMovimentacao, setItensMovimentacao] = useState([]);
  // Movimentação ligada a esta: a cotação de origem (se for saída)
  // ou a Saida gerada (se for cotação concluída).
  const [relacionada, setRelacionada] = useState(null);
  const [itensRelacionados, setItensRelacionados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), 1500);
    return () => clearTimeout(timer);
  }, [copiado]);

  const handleCopiarNotaFiscal = async () => {
    const numero = movimentacao?.numeroNotaFiscal;
    if (!numero) return;

    try {
      await navigator.clipboard.writeText(String(numero));
      setCopiado(true);
    } catch (error) {
      console.error("Erro ao copiar número da nota fiscal:", error);
    }
  };

  useEffect(() => {

    if (!pedidoBase?.id) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    const carregarDetalhes = async () => {
      setCarregando(true);
      setRelacionada(null);
      setItensRelacionados([]);

      const [mov, itens] = await Promise.all([
        buscarMovimentacao(pedidoBase.id),
        buscarItens(pedidoBase.id),
      ]);

      let outra = null;

      if (mov && ehSaida(mov) && mov.movimentacaoOriginalId) {
        outra = await buscarMovimentacao(mov.movimentacaoOriginalId);
      } else if (mov && ehCotacao(mov) && estaConcluida(mov)) {
        outra = await buscarSaidaAssociada(mov);
      }

      const itensOutra = outra ? await buscarItens(outra.id) : [];

      // Evita sobrescrever o estado se o usuário já navegou para outro pedido
      if (!ativo) return;

      setMovimentacao(mov);
      setItensMovimentacao(itens);
      setRelacionada(outra);
      setItensRelacionados(itensOutra);
      setCarregando(false);
    };

    carregarDetalhes();

    return () => {
      ativo = false;
    };
  }, [pedidoBase?.id]);

  const titulo = useMemo(() => {
    if (!movimentacao) return "Detalhes do Pedido";
    const tipo = normalizarTexto(movimentacao.tipo?.nome);
    const status = normalizarTexto(movimentacao.status?.nome);
    return `${tipo} #${movimentacao.id} - ${status}`;
  }, [movimentacao]);

  const contato = normalizarTexto(
    movimentacao?.cliente?.nomeContato ?? movimentacao?.fornecedor?.nomeContato,
  );
  const pagadorFrete = normalizarTexto(
    movimentacao?.cliente?.nomeEmpresa ??
    movimentacao?.fornecedor?.razaoSocial ??
    movimentacao?.fornecedor?.nomeEmpresa,
  );

  const relacionadaEhCotacao = relacionada ? ehCotacao(relacionada) : false;

  const handleVoltar = () => navigate("/pedidos");
  const handleEditar = () => {
    // TODO: navegar para a tela de edição do pedido, quando existir
  };
  const handleAdicionar = () => {
    // TODO: fluxo de adicionar item ao pedido
  };
  const handleVerRelacionada = () => {
    if (!relacionada?.id) return;
    navigate("/verMaisPedido", { state: { pedido: { id: relacionada.id } } });
  };

  if (!pedidoBase) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <main className={styles.mainContent}>
          <p>Nenhum pedido selecionado. Volte para a lista e selecione um item.</p>
          <Button onClick={handleVoltar}>Voltar para Pedidos</Button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        <section className={styles.infoCard}>
          <div className={styles.headerRow}>
            <div className={styles.titleGroup}>
              <button onClick={handleVoltar} className={styles.btnBack}>
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
              <h1>{carregando ? "Carregando..." : titulo}</h1>
            </div>

            <div className={styles.actionButtons}>
              <Button estilo="azul" onClick={() => { }}>
                Alterar Status
              </Button>
              <Button estilo="editar" icone="editar" onClick={handleEditar}>
                Editar
              </Button>
              <Button
                estilo="deletar"
                icone="deletar"
                onClick={() => setModalExcluirAberto(true)}
              >
                Deletar
              </Button>
              <Button
                estilo="editar"
                disabled={!movimentacao?.numeroNotaFiscal}
                onClick={handleCopiarNotaFiscal}
              >
                <span className={styles.copyContent}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="18px"
                    viewBox="0 -960 960 960"
                    width="18px"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
                  </svg>
                  {copiado ? "Copiado!" : "Nota Fiscal"}
                </span>
              </Button>
              <Button icone="adicionar" onClick={handleAdicionar}>
                Adicionar Item
              </Button>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Contato:</span>
                <span className={styles.value}>{contato}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Pagador do Frete:</span>
                <span className={styles.value}>{pagadorFrete}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Itens:</span>
                <span className={styles.value}>
                  {movimentacao?.qtdItens ?? placeholder}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Frete:</span>
                <span className={styles.value}>
                  {formatarMoeda(movimentacao?.precoFrete)}
                </span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Produto:</span>
                <span className={styles.value}>
                  {formatarMoeda(movimentacao?.precoProdutos)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Imposto:</span>
                <span className={styles.value}>
                  {formatarMoeda(movimentacao?.totalGastoImpostos)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Valor Total:</span>
                <span className={styles.value}>
                  {formatarMoeda(movimentacao?.valorTotal)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data do Pedido:</span>
                <span className={styles.value}>
                  {formatarData(movimentacao?.dataMovimentacao)}
                </span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data Prevista:</span>
                <span className={styles.value}>
                  {formatarData(movimentacao?.dataEntregaPrevista)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data da Entrega:</span>
                <span className={styles.value}>
                  {formatarData(movimentacao?.dataEntrega)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Previsto:</span>
                <span className={styles.value}>
                  {movimentacao?.qtdDiasPrevistos ?? placeholder}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Real:</span>
                <span className={styles.value}>
                  {movimentacao?.qtdDiasReal ?? placeholder}
                </span>
              </div>
            </div>
          </div>
        </section>

        <TabelaItens
          key={`principal-${pedidoBase.id}`}
          titulo={obterTituloItens(movimentacao)}
          itens={itensMovimentacao}
          carregando={carregando}
        />

        {relacionada && (
          <TabelaItens
            key={`relacionada-${relacionada.id}`}
            titulo={relacionadaEhCotacao ? "Itens da Cotação" : "Itens da Saída"}
            itens={itensRelacionados}
            carregando={carregando}
            textoBotao={relacionadaEhCotacao ? "Ver Cotação" : "Ver Saída"}
            onClickBotao={handleVerRelacionada}
          />
        )}
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={() => setModalExcluirAberto(false)}
      />
    </div>
  );
}