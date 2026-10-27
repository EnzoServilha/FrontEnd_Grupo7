import Header from "../components/Header";
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

function Dashboard() {
  const chartData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    datasets: [
      {
        label: "Compras",
        data: [10000, 22000, 35000, 48000, 55000, 62000],
        backgroundColor: "#0052cc",
        borderRadius: 0,
      },
      {
        label: "Vendas",
        data: [25000, 28000, 32000, 40000, 44000, 45000],
        backgroundColor: "#ff9f1c",
        borderRadius: 0,
      },
      {
        label: "Lucro",
        data: [45000, 48000, 52000, 58000, 56000, 54000],
        backgroundColor: "#10b981",
        borderRadius: 0,
      },
    ],
  };

  const chartOptions = {
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
          label: (context) => `R$ ${context.parsed.y.toLocaleString("pt-BR")}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 80000,
        ticks: {
          stepSize: 10000,
          callback: (value) => `R$ ${value / 1000}k`,
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
  };

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      <div className={styles.dashboardWrapper}>
        <div className={styles.cardsGrid}>
          <div className={`${styles.card} ${styles.blueBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Cotações que viraram Pedidos</span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>27,1%</h2>
              <span className={styles.cardBadge}>38 / 140</span>
            </div>
          </div>

          <div className={`${styles.card} ${styles.greenBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Cotações Concluídas Completamente</span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>18,0%</h2>
              <span className={styles.cardBadge}>18 / 100</span>
            </div>
          </div>

          <div className={`${styles.card} ${styles.orangeBorder}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Cotações Concluídas Parcialmente</span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardValue}>50,0%</h2>
              <span className={styles.cardBadge}>20 / 40</span>
            </div>
          </div>
        </div>

        <div className={styles.chartSection}>
          <h3 className={styles.chartSectionTitle}>Compras, Vendas e Lucro por Mês</h3>
          <div className={styles.chartContainer}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
