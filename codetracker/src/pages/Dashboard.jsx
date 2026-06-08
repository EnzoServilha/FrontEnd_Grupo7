import Header from "../components/Header";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "./Dashboard.module.css";

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function Dashboard() {
  const chartData = {
    labels: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ],
    datasets: [
      {
        label: "Compras",
        data: [
          10000, 22000, 35000, 48000, 55000, 62000, 70000, 50000, 38000, 48000,
          58000, 54000,
        ],
        borderColor: "#0052cc",
        backgroundColor: "#0052cc",
        tension: 0.4, // Suaviza as curvas das linhas igual ao print
      },
      {
        label: "Vendas",
        data: [
          25000, 28000, 32000, 40000, 44000, 45000, 46000, 47000, 43000, 40000,
          48000, 55000,
        ],
        borderColor: "#ff9f1c",
        backgroundColor: "#ff9f1c",
        tension: 0.4,
      },
      {
        label: "Lucro",
        data: [
          45000, 48000, 52000, 58000, 56000, 54000, 52000, 46000, 42000, 40000,
          38000, 36000,
        ],
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true, // Transforma a legenda em quadradinho/círculo
          pointStyle: "rect",
          boxWidth: 12,
          boxHeight: 12,
          font: { family: "sans-serif", size: 13, weight: "500" },
          color: "#64748b",
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
      },
    },
    scales: {
      y: {
        min: 10000,
        max: 70000,
        ticks: {
          stepSize: 10000,
          callback: (value) => `R$ ${value / 1000}k`, // Formata para R$ 10k, R$ 20k...
          color: "#94a3b8",
          font: { size: 11 },
        },
        grid: { color: "#f1f5f9" },
      },
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false }, // Remove linhas verticais de grade
      },
    },
  };

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      <div className={styles.dashboardWrapper}>
        {/* Grid de Cards Superiores */}
        <div className={styles.cardsGrid}>
          {/* Card 1 */}
          <div className={`${styles.card} ${styles.blueBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>
                Cotações que viraram Pedidos
              </span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>27,1%</h2>
              <span className={styles.cardBadge}>38 / 140</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className={`${styles.card} ${styles.greenBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>
                Cotações Concluídas Completamente
              </span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>18,0%</h2>
              <span className={styles.cardBadge}>18 / 100</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`${styles.card} ${styles.orangeBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>
                Cotações Concluídas Parcialmente
              </span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>50,0%</h2>
              <span className={styles.cardBadge}>20 / 40</span>
            </div>
          </div>
        </div>

        {/* Seção Principal do Gráfico */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartSectionTitle}>
            Compras, Vendas e Lucro por Mês
          </h3>
          <div className={styles.chartContainer}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
