import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import DeleteModal from "../components/DeleteModal";
import Filtro from "../components/Filtro";
import SearchBar from "../components/SearchBar";
import Table from "../components/Table";
import styles from "./VerMaisPedidos.module.css";

const itensVenda = [
  {
    codigo: "CT-9482X",
    precoTotal: "R$ 21.780,00",
    precoUnitario: "R$ 145,20",
    qtd: 150,
  },
  {
    codigo: "CT-1053Y",
    precoTotal: "R$ 540,00",
    precoUnitario: "R$ 45,00",
    qtd: 12,
  },
  {
    codigo: "CT-9482X",
    precoTotal: "R$ 21.780,00",
    precoUnitario: "R$ 145,20",
    qtd: 150,
  },
];

const columns = [
  { name: "Código Interno", ordena: false, tipo: "string" },
  { name: "Preço Total", ordena: true, tipo: "number" },
  { name: "Preço Unitário", ordena: true, tipo: "number" },
  { name: "Qtd. Itens", ordena: true, tipo: "number" },
];

export default function VerMaisPedidos() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const rows = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return itensVenda
      .filter((item) => {
        if (!termo) return true;
        return Object.values(item).some((valor) =>
          String(valor).toLocaleLowerCase("pt-BR").includes(termo),
        );
      })
      .map((item) => [item.codigo, item.precoTotal, item.precoUnitario, item.qtd]);
  }, [busca]);

  const handleVoltar = () => navigate("/pedidos");
  const handleEditar = () => navigate("/verMaisPedido");
  const handleAdicionar = () => navigate("/verMaisPedido");

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
              <h1>Venda #001 - Aberta</h1>
            </div>

            <div className={styles.actionButtons}>
              <Button estilo="azul" onClick={() => {}}>
                Alterar Status
              </Button>
              <Button estilo="editar" icone="editar" onClick={handleEditar}>
                Editar
              </Button>
              <Button estilo="deletar" icone="deletar" onClick={() => setModalExcluirAberto(true)}>
                Deletar
              </Button>
              <Button estilo="editar" onClick={() => {}}>
                NF-10531
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
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Pagador do Frete:</span>
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Itens:</span>
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Frete:</span>
                <span className={styles.value}>R$ XXX,00</span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Produto:</span>
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Imposto:</span>
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Valor Total:</span>
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data do Pedido:</span>
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data Prevista:</span>
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data da Entrega:</span>
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Previsto:</span>
                <span className={styles.value}>XX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Real:</span>
                <span className={styles.value}>XX</span>
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
              <Filtro ariaLabel="Filtrar itens" onClick={() => {}} />
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <Table columns={columns} rows={rows} />
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