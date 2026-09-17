import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { api } from "../provider/api";

const placeholder = "---";

const normalizarTexto = (valor) =>
  valor === null || valor === undefined || valor === "" ? placeholder : String(valor);

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

function VerMaisPecas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [peca, setPeca] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const itemSelecionado = location.state?.peca;
    const itemId = itemSelecionado?.id ?? Number(new URLSearchParams(location.search).get("id"));

    if (!itemId) {
      setCarregando(false);
      return;
    }

    const carregarDetalhes = async () => {
      try {
        setCarregando(true);

        const [respostaItem, respostaHistorico] = await Promise.all([
          api.get(`/itens/${itemId}`),
          api.get(`/itensNaMovimentacao/item/${itemId}`),
        ]);

        const item = respostaItem.data ?? {};
        const detalhado = {
          id: item.id ?? itemId,
          codigoInterno: normalizarTexto(item.codigoInterno),
          marca: normalizarTexto(item.marca),
          anoFabricacao: normalizarTexto(item.ano ?? item.anoFabricacao),
          localizacao: normalizarTexto(item.localizacao),
          quantidade: placeholder,
          dataCadastro: formatarData(item.dataCadastro),
          descricao: normalizarTexto(item.descricao),
          codigosAssociados: Array.isArray(item.codigosAssociados) ? item.codigosAssociados : [],
          itensSimilares: Array.isArray(item.itensSimilares) ? item.itensSimilares : [],
        };

        setPeca(detalhado);
        setHistorico(Array.isArray(respostaHistorico.data) ? respostaHistorico.data : []);
      } catch (error) {
        console.error("Erro ao buscar detalhes da peça:", error);
        setPeca({
          id: itemId,
          codigoInterno: placeholder,
          marca: placeholder,
          anoFabricacao: placeholder,
          localizacao: placeholder,
          quantidade: placeholder,
          dataCadastro: placeholder,
          descricao: placeholder,
          codigosAssociados: [],
          itensSimilares: [],
        });
        setHistorico([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDetalhes();
  }, [location.search, location.state]);

  const columnsCodigos = useMemo(
    () => [
      { name: "Código item", ordena: true, tipo: "string" },
      { name: "Cliente/Fornecedor", ordena: true, tipo: "string" },
    ],
    [],
  );

  const rowsCodigos = useMemo(
    () =>
      (peca?.codigosAssociados ?? []).map((codigo) => {
        const nome = codigo?.fornecedor?.razaoSocial ?? codigo?.cliente?.nome ?? placeholder;
        return [normalizarTexto(codigo?.codigo), nome];
      }),
    [peca],
  );

  const columnsHistorico = useMemo(
    () => [
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
    ],
    [],
  );

  const rowsHistorico = useMemo(
    () =>
      historico.map((registro) => {
        const movimentacao = registro?.movimentacaoEstoque ?? {};
        const tipo = movimentacao?.tipo?.nome ?? placeholder;
        const status = movimentacao?.status?.nome ?? placeholder;
        const valorTotal = formatarMoeda(movimentacao?.valorTotal ?? registro?.valorTotal);
        const frete = formatarMoeda(movimentacao?.precoFrete ?? 0);
        const imposto = formatarMoeda(movimentacao?.totalGastoImpostos ?? 0);
        const produtos = formatarMoeda(movimentacao?.precoProdutos ?? 0);
        const qtdItens = movimentacao?.qtdItens ?? registro?.qtd ?? placeholder;
        const dataEntrega = formatarData(movimentacao?.dataEntrega);
        const dataPrevista = formatarData(movimentacao?.dataEntregaPrevista);
        const dataPedido = formatarData(movimentacao?.dataMovimentacao);

        return [
          tipo,
          status,
          valorTotal,
          movimentacao?.cliente?.nome ?? movimentacao?.fornecedor?.razaoSocial ?? placeholder,
          frete,
          imposto,
          produtos,
          qtdItens,
          dataEntrega,
          dataPrevista,
          dataPedido,
        ];
      }),
    [historico],
  );

  const mediasMovimentacao = useMemo(() => {
    const registros = Array.isArray(historico) ? historico : [];

    const acumuladores = {
      compra: { total: 0, quantidade: 0 },
      venda: { total: 0, quantidade: 0 },
    };

    registros.forEach((registro) => {
      const movimentacao = registro?.movimentacaoEstoque ?? registro ?? {};
      const tipo = String(movimentacao?.tipo?.nome ?? "").trim().toUpperCase();
      const valorTotal = Number(movimentacao?.valorTotal ?? registro?.valorTotal ?? 0);
      const qtdItens = Number(movimentacao?.qtdItens ?? registro?.qtdItens ?? registro?.qtd ?? 0);

      if (!Number.isFinite(valorTotal) || !Number.isFinite(qtdItens) || qtdItens <= 0) {
        return;
      }

      if (tipo.includes("ENTRADA") || tipo.includes("COMPRA")) {
        acumuladores.compra.total += valorTotal;
        acumuladores.compra.quantidade += qtdItens;
      }

      if (tipo.includes("SAIDA") || tipo.includes("VENDA")) {
        acumuladores.venda.total += valorTotal;
        acumuladores.venda.quantidade += qtdItens;
      }
    });

    const calcularMedia = ({ total, quantidade }) =>
      quantidade > 0 ? total / quantidade : null;

    return {
      compra: calcularMedia(acumuladores.compra),
      venda: calcularMedia(acumuladores.venda),
    };
  }, [historico]);

  const columnsSimilares = useMemo(
    () => [
      { name: "Código Interno Item", ordena: true, tipo: "string" },
      { name: "Descrição", ordena: true, tipo: "string" },
    ],
    [],
  );

  const rowsSimilares = useMemo(
    () =>
      (peca?.itensSimilares ?? []).map((similar) => [
        normalizarTexto(similar?.codigoInterno),
        normalizarTexto(similar?.marca ?? similar?.descricao ?? "Peça similar"),
      ]),
    [peca],
  );

  const voltar = () => navigate(-1);

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
            <Button icone="editar" estilo="editar">
              Editar
            </Button>
            <Button icone="deletar" estilo="deletar">
              Deletar
            </Button>
          </div>
        </div>

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
                      <p>{peca?.quantidade}</p>
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
                </>
              )}
            </section>

            <section className={styles.kpiPricesRow}>
              <Kpi
                title="Preço Médio de Compra"
                value={mediasMovimentacao.compra !== null ? formatarMoeda(mediasMovimentacao.compra) : placeholder}
              />
              <Kpi
                title="Preço Médio de Venda"
                value={mediasMovimentacao.venda !== null ? formatarMoeda(mediasMovimentacao.venda) : placeholder}
              />
            </section>

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
                <Table columns={columnsCodigos} rows={rowsCodigos.length ? rowsCodigos : [[placeholder, placeholder]]} />
              </div>
            </section>
          </div>

          <section className={styles.suppliersCard}>
            <div className={styles.searchHeader}>
              <div className={styles.menuContainer}>
                <button
                  type="button"
                  className={styles.optionsButton}
                  aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                  aria-expanded={menuBuscaAberto}
                  aria-controls="campos-busca-fornecedores"
                  title={`Pesquisar por: ${campoBuscaAtivo}`}
                  onClick={() => {
                    setMenuBuscaAberto((aberto) => !aberto);
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                </button>

                {menuBuscaAberto && (
                  <div
                    id="campos-busca-fornecedores"
                    className={styles.popover}
                    role="menu"
                  >
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
              <SearchBar />
              <Filtro />
            </div>
            <div className={styles.chartContainer}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.chartWrapper}>
                  <CardGraficoPecas
                    supplierName="---"
                    location="---"
                    kpis={{
                      onTimeDelivery: "---",
                      paidFreight: "---",
                      medianDeliveryTime: "---",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.bottomGrid}>
          <section className={styles.cardBottom}>
            <div className={styles.sectionHeader}>
              <h2>Histórico de Vendas e Compras</h2>
              <div className={styles.filterGroup}>
                <div className={styles.menuContainer}>
                  <button
                    type="button"
                    className={styles.optionsButton}
                    aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                    aria-expanded={menuBuscaAberto}
                    aria-controls="campos-busca-historico"
                    title={`Pesquisar por: ${campoBuscaAtivo}`}
                    onClick={() => {
                      setMenuBuscaAberto((aberto) => !aberto);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </button>

                  {menuBuscaAberto && (
                    <div
                      id="campos-busca-historico"
                      className={styles.popover}
                      role="menu"
                    >
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
                <SearchBar size="500px" />
                <Filtro />
              </div>
            </div>
            <Table
              columns={columnsHistorico}
              rows={rowsHistorico.length ? rowsHistorico : [[placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder]]}
            />
          </section>

          <section className={`${styles.cardBottom} ${styles.cardSimilares}`}>
            <div className={styles.sectionHeader}>
              <h2>Peças Similares</h2>
              <div className={styles.filterGroup}>
                <div className={styles.menuContainer}>
                  <button
                    type="button"
                    className={styles.optionsButton}
                    aria-label={`Pesquisar por: ${campoBuscaAtivo}`}
                    aria-expanded={menuBuscaAberto}
                    aria-controls="campos-busca-similares"
                    title={`Pesquisar por: ${campoBuscaAtivo}`}
                    onClick={() => {
                      setMenuBuscaAberto((aberto) => !aberto);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </button>

                  {menuBuscaAberto && (
                    <div
                      id="campos-busca-similares"
                      className={styles.popover}
                      role="menu"
                    >
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
            <Table
              columns={columnsSimilares}
              rows={rowsSimilares.length ? rowsSimilares : [[placeholder, placeholder]]}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default VerMaisPecas;
