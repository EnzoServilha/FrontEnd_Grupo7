import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import { api } from "../provider/api";
import styles from "./VerMaisPedidos.module.css";

const placeholder = "---";

const normalizarTexto = (valor) => {
  if (valor === null || valor === undefined || valor === "") return placeholder;
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

const columns = [
  { name: "Código Interno", ordena: false, tipo: "string" },
  { name: "Preço Total", ordena: true, tipo: "number" },
  { name: "Preço Unitário", ordena: true, tipo: "number" },
  { name: "Qtd. Itens", ordena: true, tipo: "number" },
];

export default function VerMaisPedidos() {
  const navigate = useNavigate();
  const location = useLocation();
  const pedidoBase = location.state?.pedido ?? null;

  const [movimentacao, setMovimentacao] = useState(null);
  const [itensMovimentacao, setItensMovimentacao] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  useEffect(() => {
    if (!pedidoBase?.id) {
      setCarregando(false);
      return;
    }

    const carregarDetalhes = async () => {
      setCarregando(true);

      try {
        const respostaMovimentacao = await api.get(`/movimentacoes/${pedidoBase.id}`);
        setMovimentacao(respostaMovimentacao.data ?? null);
      } catch (error) {
        console.error("Erro ao buscar movimentação:", error);
        setMovimentacao(null);
      }

      try {
        const respostaItens = await api.get(`/itensNaMovimentacao/movimentacao/${pedidoBase.id}`);
        console.log("itens recebidos:", respostaItens.data);
        setItensMovimentacao(Array.isArray(respostaItens.data) ? respostaItens.data : []);
      } catch (error) {
        console.error("Erro ao buscar itens da movimentação:", error);
        setItensMovimentacao([]);
      }

      setCarregando(false);
    };

    carregarDetalhes();
  }, [pedidoBase?.id]);

  const titulo = useMemo(() => {
    if (!movimentacao) return "Detalhes do Pedido";
    const tipo = normalizarTexto(movimentacao.tipo?.nome);
    const status = normalizarTexto(movimentacao.status?.nome);
    return `${tipo} #${movimentacao.id} - ${status}`;
  }, [movimentacao]);

  // ASSUNÇÃO (confirme comigo): o retorno de /movimentacoes/{id} não tem um
  // campo próprio para "Contato" nem "Pagador do Frete", então estou usando
  // nomeContato (pessoa) do cliente/fornecedor como Contato, e
  // nomeEmpresa/razaoSocial (empresa) como Pagador do Frete.
  const contato = normalizarTexto(
    movimentacao?.cliente?.nomeContato ?? movimentacao?.fornecedor?.nomeContato,
  );
  const pagadorFrete = normalizarTexto(
    movimentacao?.cliente?.nomeEmpresa ??
    movimentacao?.fornecedor?.razaoSocial ??
    movimentacao?.fornecedor?.nomeEmpresa,
  );

  const rows = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return itensMovimentacao
      .filter((registro) => {
        if (!termo) return true;
        const codigo = registro?.item?.codigoInterno ?? "";
        return String(codigo).toLocaleLowerCase("pt-BR").includes(termo);
      })
      .map((registro) => {
        const qtd = Number(registro?.qtd ?? 0);
        const precoUnitario = Number(registro?.precoUnitario ?? 0);
        // ASSUNÇÃO: a API não retorna um "precoTotal" por item — calculando
        // como qtd * precoUnitario.
        const precoTotal = qtd * precoUnitario;

        return [
          normalizarTexto(registro?.item?.codigoInterno),
          formatarMoeda(precoTotal),
          formatarMoeda(precoUnitario),
          qtd,
        ];
      });
  }, [busca, itensMovimentacao]);

  const handleVoltar = () => navigate("/pedidos");
  const handleEditar = () => {
    // TODO: navegar para a tela de edição do pedido, quando existir
  };
  const handleAdicionar = () => {
    // TODO: fluxo de adicionar item ao pedido
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
              <Button estilo="editar" onClick={() => { }}>
                {normalizarTexto(movimentacao?.numeroNotaFiscal)}
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

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2>Itens da Venda</h2>
            <div className={styles.filterControls}>
              <SearchBar
                placeholder="Digite para procurar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                ariaLabel="Buscar itens da venda"
              />
              <Filtro ariaLabel="Filtrar itens" onClick={() => { }} />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <Table
              key={`${carregando}-${itensMovimentacao.map((i) => i.id).join(",")}`}
              columns={columns}
              rows={
                carregando
                  ? [[placeholder, placeholder, placeholder, placeholder]]
                  : rows
              }
            />
          </div>
        </section>
      </main>

      <DeleteModal
        isOpen={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={() => setModalExcluirAberto(false)}
      />
    </div>
  );
}