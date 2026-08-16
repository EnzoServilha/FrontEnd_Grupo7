import Header from "../components/Header";
import Button from "../components/Button";
import Kpi from "../components/Kpi";
import FilterButton from "../components/Filtro";
import styles from "./VerMaisCliente.module.css";
import Table from "../components/Table";
import SearchBar from "../components/SearchBar";

function VerMaisFornecedor() {
  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.content}>
        <div className={styles.headerCliente}>
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
            <h1>Detalhes do Fornecedor</h1>
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

        <div className={styles.gridContainer}>
          <section className={styles.cardInfo}>
            <h2 className={styles.clientTitle}>
              Nome da Empresa - Nome do Contato
            </h2>

            <div className={styles.infoList}>
              <p>
                <strong>Telefone:</strong> +55 (XX) XXXXX-XXXX
              </p>
              <p>
                <strong>E-mail:</strong> xxxxxx.xxxxxxxxxxx@xxxxx.com
              </p>
              <p>
                <strong>CNPJ:</strong> XX.XXX.XXX/XXXX-XX
              </p>
              <p>
                <strong>Razão Social:</strong> Xxxxxxx Xxxxxxx Xxx
              </p>
              <p>
                <strong>Data Cadastro:</strong> XX/XX/XXXX
              </p>
            </div>

            <div className={styles.sectionBlock}>
              <h3>Observações:</h3>
              <p className={styles.observationText}>
                Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
              </p>
            </div>

            <div className={styles.sectionBlock}>
              <h3>Localização:</h3>
              <div className={styles.locationGrid}>
                <div>
                  <p>
                    <strong>Estado:</strong> XXX XXXXX
                  </p>
                  <p>
                    <strong>Cidade:</strong> Xxx Xxxxx
                  </p>
                  <p>
                    <strong>CEP:</strong> XXXXX-XXX
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Bairro:</strong> Xxxx Xxxxxxxx
                  </p>
                  <p>
                    <strong>Logradouro:</strong> Xx. Xxxxx Xxxxxxxx
                  </p>
                  <p>
                    <strong>Número:</strong> XXX
                  </p>
                  <p>
                    <strong>Complemento:</strong> Xxxxx Xxxxxxx XXX
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.rightColumn}>
            <section className={styles.kpiContainer}>
              <div className={styles.kpiRow}>
                <Kpi title="Entregas dentro do Prazo" value="XX%" />
                <Kpi title="Entregas com Frete Pago" value="XX%" />
                <Kpi title="Mediana de Tempo de Entrega" value="XXX dias" />
              </div>
            </section>

            <section className={styles.cardHistory}>
              <div className={styles.historyHeader}>
                <h2>Histórico de Compras</h2>
                <div className={styles.filterGroup}>
                  <select className={styles.selectFilter}>
                    <option value=""></option>
                  </select>
                  <SearchBar />
                  <FilterButton />
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <Table
                  columns={[
                    { name: "Status", ordena: false, tipo: "string" },
                    { name: "Valor Total", ordena: true, tipo: "number" },
                    { name: "Pagador do Frete", ordena: false, tipo: "string" },
                    { name: "Preço do Frete", ordena: true, tipo: "number" },
                    { name: "Preço do Imposto", ordena: true, tipo: "number" },
                    {
                      name: "Preço dos Produtos",
                      ordena: true,
                      tipo: "number",
                    },
                    { name: "Qtd. Itens", ordena: true, tipo: "number" },
                    { name: "Data da Entrega", ordena: true, tipo: "date" },
                    { name: "Data Prevista", ordena: true, tipo: "date" },
                    { name: "Data do Pedido", ordena: true, tipo: "date" },
                    {
                      name: "Qtd. Dias Previsto",
                      ordena: true,
                      tipo: "number",
                    },
                    { name: "Qtd. Dias Real", ordena: true, tipo: "number" },
                    { name: "Nº Nota Fiscal", ordena: false, tipo: "number" },
                  ]}
                  rows={[
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                    [
                      "XXX",
                      "R$ X.XXX,XX",
                      "XXXXXXXXX",
                      "R$ XX,XX",
                      "R$ XX,XX",
                      "R$ X.XXX,XX",
                      "XX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "XX/XX/XXXX",
                      "X",
                      "X",
                      <Button icone="verMais" estilo="verMais">
                        Ver Mais
                      </Button>,
                    ],
                  ]}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerMaisFornecedor;
