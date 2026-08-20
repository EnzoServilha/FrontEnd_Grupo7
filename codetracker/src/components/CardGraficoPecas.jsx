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
import styles from "./CardGraficoPecas.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function CardGraficoPecas({
  supplierName = "Fornecedor A",
  location = "UF - Cidade",
  kpis = {
    onTimeDelivery: "XX%",
    paidFreight: "XX%",
    medianDeliveryTime: "XXX dias",
  },
  chartData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
    unitPrice: [100, 105, 98, 110, 108],
    taxes: [15, 15, 14, 16, 16],
    freight: [10, 12, 10, 8, 11],
  },
}) {
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Preço Unitário",
        data: chartData.unitPrice,
        borderColor: "#0284c7",
        backgroundColor: "#0284c7",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "Impostos",
        data: chartData.taxes,
        borderColor: "#eab308",
        backgroundColor: "#eab308",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "Frete",
        data: chartData.freight,
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
        title: { display: true, text: "Data", font: { size: 10 } },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 10 } },
        title: { display: true, text: "R$", font: { size: 10 } },
      },
    },
  };

  return (
    <div className={styles.supplierBlock}>
      <div className={styles.supplierHeader}>
        <h2>{supplierName}</h2>
        <span className={styles.locationTag}>📍 {location}</span>
      </div>

      <div className={styles.miniKpisContainer}>
        <div className={styles.miniKpiCard}>
          <span className={styles.miniKpiTitle}>Entregas no Prazo</span>
          <strong className={styles.miniKpiValue}>{kpis.onTimeDelivery}</strong>
        </div>
        <div className={styles.miniKpiCard}>
          <span className={styles.miniKpiTitle}>Frete Pago</span>
          <strong className={styles.miniKpiValue}>{kpis.paidFreight}</strong>
        </div>
        <div className={styles.miniKpiCard}>
          <span className={styles.miniKpiTitle}>Mediana de Tempo</span>
          <strong className={styles.miniKpiValue}>
            {kpis.medianDeliveryTime}
          </strong>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <h4>Variação de Preços por Compra</h4>
        <div className={styles.chartContainer}>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

export default CardGraficoPecas;
