import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { api } from "../provider/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import styles from "./Dashboard.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatPercent(valor) {
  const numero = Number(valor ?? 0);
  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formataBadge(total, totalGeral) {
  if (!totalGeral || totalGeral === 0) {
    return "0 / 0";
  }

  return `${total} / ${totalGeral}`;
}

function montarDadosMensais(dados = []) {
  const mapMes = new Map();

  dados.forEach((item) => {
    const mes = Number(item?.mes ?? 0);
    if (mes > 0) {
      mapMes.set(mes, item);
    }
  });

  return MESES.map((label, index) => {
    const mesNumero = index + 1;
    const item = mapMes.get(mesNumero) ?? {};

    return {
      label,
      mes: mesNumero,
      totalCompras: Number(item.totalCompras ?? 0),
      totalVendas: Number(item.totalVendas ?? 0),
      lucro: Number(item.lucro ?? 0),
    };
  });
}

function Dashboard() {
  const [dadosDashboard, setDadosDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        setCarregando(true);
        setErro("");

        const respostaPeriodo = await api.get("/periodos/ultimo");
        const periodoId = respostaPeriodo?.data?.id;

        if (!periodoId) {
          setDadosDashboard(null);
          return;
        }

        const [respostaCotacoes, respostaMensal] = await Promise.all([
          api.get(`/movimentacoes/${periodoId}/status-cotacoes`),
          api.get(`/movimentacoes/${periodoId}/dados-mensais`),
        ]);

        setDadosDashboard({
          cotacoes: respostaCotacoes?.data ?? {},
          mensal: montarDadosMensais(respostaMensal?.data ?? []),
        });
      } catch (error) {
        const mensagem =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Não foi possível carregar os dados do dashboard.";

        setErro(mensagem);
        setDadosDashboard(null);
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosDashboard();
  }, []);

  const chartData = useMemo(() => {
    const dadosMensais = dadosDashboard?.mensal ?? montarDadosMensais();

    const valores = [
      ...dadosMensais.map((mes) => mes.totalCompras),
      ...dadosMensais.map((mes) => mes.totalVendas),
      ...dadosMensais.map((mes) => mes.lucro),
    ];

    const maiorValor = Math.max(...valores, 1);

    return {
      labels: dadosMensais.map((mes) => mes.label),
      datasets: [
        {
          label: "Compras",
          data: dadosMensais.map((mes) => mes.totalCompras),
          backgroundColor: "#0052cc",
          borderRadius: 0,
        },
        {
          label: "Vendas",
          data: dadosMensais.map((mes) => mes.totalVendas),
          backgroundColor: "#ff9f1c",
          borderRadius: 0,
        },
        {
          label: "Lucro",
          data: dadosMensais.map((mes) => mes.lucro),
          backgroundColor: "#10b981",
          borderRadius: 0,
        },
      ],
    };
  }, [dadosDashboard]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          boxWidth: 12,
          boxHeight: 12,
          color: "#64748b",
          font: {
            family: "sans-serif",
            size: 13,
            weight: "500",
          },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        callbacks: {
          label: (context) => `R$ ${Number(context.parsed.y).toLocaleString("pt-BR")}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: Math.max(...chartData.datasets.flatMap((dataset) => dataset.data), 1000) * 1.2,
        ticks: {
          callback: (value) => `R$ ${Number(value) / 1000}k`,
          color: "#94a3b8",
          font: { size: 11 },
        },
        grid: {
          color: "#f1f5f9",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
        },
      },
    },
  }), [chartData]);

  const cotacoes = dadosDashboard?.cotacoes ?? {};

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      <div className={styles.dashboardWrapper}>
        {erro ? (
          <div className={styles.cardError}>{erro}</div>
        ) : (
          <>
            <div className={styles.cardsGrid}>
              <div className={`${styles.card} ${styles.blueBorder}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Cotações que viraram Pedidos</span>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardValue}>
                    {carregando ? "--" : formatPercent(cotacoes.porcentagemViraramPedidos)}
                  </h2>
                  <span className={styles.cardBadge}>
                    {carregando
                      ? "0 / 0"
                      : formataBadge(
                          cotacoes.totalCotacoesViraramPedidos,
                          cotacoes.totalCotacoes,
                        )}
                  </span>
                </div>
              </div>

              <div className={`${styles.card} ${styles.greenBorder}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Cotações Concluídas Completamente</span>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardValue}>
                    {carregando ? "--" : formatPercent(cotacoes.porcentagemConcluidasTotalmente)}
                  </h2>
                  <span className={styles.cardBadge}>
                    {carregando
                      ? "0 / 0"
                      : formataBadge(
                          cotacoes.totalCotacoesConcluidasTotalmente,
                          cotacoes.totalCotacoes,
                        )}
                  </span>
                </div>
              </div>

              <div className={`${styles.card} ${styles.orangeBorder}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Cotações Concluídas Parcialmente</span>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardValue}>
                    {carregando ? "--" : formatPercent(cotacoes.porcentagemConcluidasParcial)}
                  </h2>
                  <span className={styles.cardBadge}>
                    {carregando
                      ? "0 / 0"
                      : formataBadge(
                          cotacoes.totalCotacoesConcluidasParcial,
                          cotacoes.totalCotacoes,
                        )}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.chartSection}>
              <h3 className={styles.chartSectionTitle}>Compras, Vendas e Lucro por Mês</h3>
              <div className={styles.chartContainer}>
                {carregando ? <p>Carregando gráfico...</p> : <Bar data={chartData} options={chartOptions} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
