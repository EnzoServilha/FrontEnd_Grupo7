import Header from "../components/Header";
import Button from "../components/Button";
import Filtro from "../components/Filtro";
import Kpi from "../components/Kpi";
import Table from "../components/Table";
import styles from "./VerMaisPecas.module.css";
import SearchBar from "../components/SearchBar";

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
              <h3>Códigos Associados</h3>
              <div className={styles.btnRow}>
                <Button
                  estilo="adicionar"
                  onClick={() => (window.location.href = "/associarCodigo")}
                >
                  + Adicionar
                </Button>
                <Button icone="editar" estilo="editar">
                  Editar
                </Button>
                <Button icone="deletar" estilo="deletar">
                  Deletar
                </Button>
              </div>
              <Table columns={columnsCodigos} rows={rowsCodigos} />
            </section>
          </div>

          {/* Coluna Direita Superior: Cards dos Fornecedores A e B */}
          <section className={styles.suppliersCard}>
            <div className={styles.searchHeader}>
              <select className={styles.selectFilter}>
                <option value=""></option>
              </select>
              <SearchBar />
              <Filtro />
            </div>

            <div className={styles.suppliersGrid}>
              {/* Fornecedor A */}
              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>

              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>

              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>

              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>

              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>
              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>
              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor A</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
              </div>

              {/* Fornecedor B */}
              <div className={styles.supplierBlock}>
                <div className={styles.supplierHeader}>
                  <h2>Fornecedor B</h2>
                  <span className={styles.locationTag}>📍 UF - Cidade</span>
                </div>
                <div className={styles.miniKpis}>
                  <Kpi title="Entregas dentro do Prazo" value="XX%" />
                  <Kpi title="Entregas com Frete Pago" value="XX%" />
                  <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
                </div>
                <div className={styles.chartWrapper}>
                  <h4>Variação de Preços por Compra</h4>
                  <div className={styles.legends}>
                    <span>Legend visual</span>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      Preço Unitário
                    </span>
                    <span className={`${styles.badge} ${styles.yellow}`}>
                      Impostos
                    </span>
                    <span className={`${styles.badge} ${styles.green}`}>
                      Frete
                    </span>
                  </div>
                  <div className={styles.mockChart}>
                    <span className={styles.yAxis}>R$</span>
                    <svg viewBox="0 0 300 100" className={styles.chartSvg}>
                      <path
                        d="M10 80 Q 75 40, 150 60 T 290 70"
                        stroke="#3b82f6"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 60 Q 75 50, 150 40 T 290 30"
                        stroke="#eab308"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 40 Q 75 20, 150 30 T 290 50"
                        stroke="#22c55e"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className={styles.xAxis}>Data</span>
                  </div>
                </div>
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
                <select className={styles.selectFilter}>
                  <option value=""></option>
                </select>
                <SearchBar />
                <Filtro />
              </div>
            </div>
            <Table columns={columnsHistorico} rows={rowsHistorico} />
          </section>

          {/* Peças Similares */}
          <section className={styles.cardBottom}>
            <div className={styles.sectionHeader}>
              <h2>Peças Similares</h2>
              <div className={styles.filterGroup}>
                <select className={styles.selectFilter}>
                  <option value=""></option>
                </select>
                <SearchBar />
                <Filtro />
                <Button
                  estilo="adicionar"
                  onClick={() => (window.location.href = "/assimilarPecas")}
                >
                  + Adicionar
                </Button>
                <Button icone="deletar" estilo="deletar">
                  Deletar
                </Button>
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
