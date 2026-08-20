import Header from "../components/Header";
import Button from "../components/Button";
import ButtonMenor from "../components/ButtonMenor";
import Filtro from "../components/Filtro";
import Kpi from "../components/Kpi";
import Table from "../components/Table";
import styles from "./VerMaisPecas.module.css";
import SearchBar from "../components/SearchBar";
import CardGraficoPecas from "../components/CardGraficoPecas";
import Select from "../components/Select";

function VerMaisPecas() {
  // Configuração das Colunas e Linhas para a Tabela de Códigos Associados
  const columnsCodigos = [
    { name: "Código item", ordena: true, tipo: "string" },
    { name: "Cliente/Fornecedor", ordena: true, tipo: "string" },
  ];

  const rowsCodigos = [
    ["Código item", "Cliente/Fornecedor"],
    ["Código item", "Cliente/Fornecedor"],
    ["Código item", "Cliente/Fornecedor"],
  ];

  // Configuração para a Tabela de Histórico de Vendas e Compras
  const columnsHistorico = [
    { name: "Tipo", ordena: true, tipo: "string" },
    { name: "Status", ordena: true, tipo: "string" },
    { name: "Valor Total", ordena: true, tipo: "number" },
    { name: "Pagador do Frete", ordena: false },
    { name: "Preço do Frete", ordena: true, tipo: "number" },
    { name: "Preço do Imposto", ordena: true, tipo: "number" },
    { name: "Preço dos Produtos", ordena: true, tipo: "number" },
    { name: "Qtd. Itens", ordena: true, tipo: "number" },
    { name: "Data da Entrega", ordena: true, tipo: "date" },
    { name: "Data Prevista", ordena: true, tipo: "date" },
    { name: "Data do Pedido", ordena: true, tipo: "date" },
  ];

  const rowsHistorico = [
    [
      "Compra",
      "Concluída",
      "R$ X.XXX,00",
      "XXXXX",
      "R$ XXX,00",
      "R$ XXX,00",
      "R$ XXX,00",
      "XX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
    ],
    [
      "Venda",
      "Concluída com Atraso",
      "R$ X.XXX,00",
      "XXXXX",
      "R$ XXX,00",
      "R$ XXX,00",
      "R$ XXX,00",
      "XX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
    ],
    [
      "Venda",
      "Em Andamento",
      "R$ X.XXX,00",
      "XXXXX",
      "R$ XXX,00",
      "R$ XXX,00",
      "R$ XXX,00",
      "XX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
    ],
    [
      "Compra",
      "Cancelada",
      "R$ X.XXX,00",
      "XXXXX",
      "R$ XXX,00",
      "R$ XXX,00",
      "R$ XXX,00",
      "XX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
      "XX/XX/XXXX",
    ],
  ];

  // Configuração para a Tabela de Peças Similares
  const columnsSimilares = [
    { name: "Código Interno Item", ordena: true, tipo: "string" },
    { name: "Descrição", ordena: true, tipo: "string" },
  ];

  const rowsSimilares = [
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
    [
      "XXXXXXXXXXXXXXX",
      "Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ],
  ];

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.content}>
        {/* Cabeçalho superior */}
        <div className={styles.headerPeca}>
          <div className={styles.titleGroup}>
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
            <h1>Detalhes da Peça</h1>
          </div>

          <div className={styles.actionButtons}>
            <Button icone="editar" estilo="editar">
              Editar
            </Button>
            <Button icone="deletar" estilo="deletar">
              Deletar
            </Button>
          </div>
        </div>

        {/* --- GRID SUPERIOR (Informações + Fornecedores/Gráficos) --- */}
        <div className={styles.topGrid}>
          {/* Coluna Esquerda Superior */}
          <div className={styles.leftTopColumn}>
            {/* Detalhes da Peça */}
            <section className={styles.cardInfo}>
              <div className={styles.infoGrid}>
                <div>
                  <strong>Código Interno:</strong>
                  <p>XXXXX</p>
                </div>
                <div>
                  <strong>Marca:</strong>
                  <p>XXXXX</p>
                </div>
                <div>
                  <strong>Ano de Fabricação:</strong>
                  <p>XXXXX</p>
                </div>
                <div>
                  <strong>Localização:</strong>
                  <p>XXXXX</p>
                </div>
                <div>
                  <strong>Quantidade em Estoque:</strong>
                  <p>XXXXX</p>
                </div>
                <div>
                  <strong>Data de Cadastro:</strong>
                  <p>XXXXX</p>
                </div>
              </div>
              <div className={styles.descriptionBlock}>
                <strong>Descrição:</strong>
                <p>
                  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                </p>
              </div>
            </section>

            {/* Preços Médios */}
            <section className={styles.kpiPricesRow}>
              <Kpi title="Preço Médio de Compra" value="R$ XXX,00" />
              <Kpi title="Preço Médio de Venda" value="R$ XXX,00" />
            </section>

            {/* Códigos Associados com Tabela */}
            <section className={styles.cardCodigos}>
              <div className={styles.btnRow}>
                <h3>Códigos Associados</h3>
                <ButtonMenor
                  estilo="adicionar"
                  onClick={() => (window.location.href = "/associarCodigo")}
                >
                  + Adicionar
                </ButtonMenor>
                <ButtonMenor icone="editar" estilo="editar">
                  Editar
                </ButtonMenor>
                <ButtonMenor icone="deletar" estilo="deletar">
                  Deletar
                </ButtonMenor>
              </div>
              <div className={styles.tableWrapper}>
                <Table columns={columnsCodigos} rows={rowsCodigos} />
              </div>
            </section>
          </div>

          {/* Coluna Direita Superior: Cards dos Fornecedores A e B */}
          <section className={styles.suppliersCard}>
            <div className={styles.searchHeader}>
              <Select options={[{ value: null, name: "Pesquisar Por" }]} />
              <SearchBar />
              <Filtro />
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>

              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>

              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>

              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>

              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>

              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>
              <div className={styles.chartWrapper}>
                <CardGraficoPecas
                  supplierName="Fornecedor A"
                  location="UF - Cidade"
                  kpis={{
                    onTimeDelivery: "XX%",
                    paidFreight: "XX%",
                    medianDeliveryTime: "XX dias",
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* --- GRID INFERIOR (Histórico + Peças Similares) --- */}
        <div className={styles.bottomGrid}>
          {/* Histórico de Vendas e Compras */}
          <section className={styles.cardBottom}>
            <div className={styles.sectionHeader}>
              <h2>Histórico de Vendas e Compras</h2>
              <div className={styles.filterGroup}>
                <Select options={[{ value: null, name: "Pesquisar Por" }]} />
                <SearchBar size="500px" />
                <Filtro />
              </div>
            </div>
            <Table columns={columnsHistorico} rows={rowsHistorico} />
          </section>

          <section className={styles.cardBottom}>
            <div className={styles.sectionHeader}>
              <h2>Peças Similares</h2>
              <div className={styles.filterGroup}>
                <Select options={[{ value: null, name: "Pesquisar Por" }]} />
                <SearchBar size="250px" />
                <Filtro />
                <ButtonMenor
                  estilo="adicionar"
                  onClick={() => (window.location.href = "/assimilarPecas")}
                >
                  + Adicionar
                </ButtonMenor>
                <ButtonMenor icone="deletar" estilo="deletar">
                  Deletar
                </ButtonMenor>
              </div>
            </div>
            <Table columns={columnsSimilares} rows={rowsSimilares} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default VerMaisPecas;
