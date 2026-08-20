import { useState } from "react";
import styles from "./VerMaisPedidos.module.css";

export default function VerMaisPedidos() {
  const [busca, setBusca] = useState("");

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

  return (
    <div className={styles.pageContainer}>
      {/* Navbar Superior */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          Code<span>Tracker</span>
        </div>

        <nav className={styles.navMenu}>
          <a href="#dashboard">Dashboard</a>
          <a href="#pecas">Peças</a>
          <a href="#contatos">Contatos</a>
          <a href="#pedidos" className={styles.activeNav}>
            Pedidos
          </a>
          <a href="#periodo">Período</a>
        </nav>

        <div className={styles.userSection}>
          <div className={styles.colorBadge}></div>
          <div className={styles.userBadge}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#0284c7"
            >
              <path d="M234-276q51-39 114-61.5T480-360q63 0 126 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T920-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>
            <span>Usuário Conectado</span>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Card Superior de Informações da Venda */}
        <section className={styles.infoCard}>
          <div className={styles.headerRow}>
            <div className={styles.titleGroup}>
              <button className={styles.btnBack} title="Voltar">
                <svg
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
              <button className={styles.btnStatus}>
                <span className={styles.dropdownIcon}>▼</span> Alterar Status
              </button>
              <button className={styles.btnEdit}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="#334155"
                >
                  <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                </svg>
                Editar
              </button>
              <button className={styles.btnDelete}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="#dc2626"
                >
                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                </svg>
                Deletar
              </button>
              <button className={styles.btnNf}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="#64748b"
                >
                  <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h480v80H200Zm160-240v-480 480Z" />
                </svg>
                NF-10531
              </button>
            </div>
          </div>

          {/* Grid Responsivo de Informações */}
          <div className={styles.detailsGrid}>
            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Contato:</span>{" "}
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Pagador do Frete:</span>{" "}
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Itens:</span>{" "}
                <span className={styles.value}>XXXXXXXX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Frete:</span>{" "}
                <span className={styles.value}>R$ XXX,00</span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Produto:</span>{" "}
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Preço do Imposto:</span>{" "}
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Valor Total:</span>{" "}
                <span className={styles.value}>R$ XXX,00</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data do Pedido:</span>{" "}
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data Prevista:</span>{" "}
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Data da Entrega:</span>{" "}
                <span className={styles.value}>DD/MM/AAAA</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Previsto:</span>{" "}
                <span className={styles.value}>XX</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Qtd. Dias Real:</span>{" "}
                <span className={styles.value}>XX</span>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Itens da Venda */}
        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2>Itens da Venda</h2>
            <div className={styles.filterControls}>
              <select className={styles.selectFilter}>
                <option value=""></option>
              </select>
              <input
                type="text"
                placeholder="Digite para procurar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={styles.searchInput}
              />
              <button className={styles.btnFilterIcon} title="Filtrar">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  fill="#475569"
                >
                  <path d="M440-160v-240L186-680h588L520-400v240h-80Zm40-276 200-244H280l200 244Zm0 0Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabela de Itens em Largura Total */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código Interno</th>
                  <th>
                    <div className={styles.thContent}>
                      Preço Total
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16px"
                        viewBox="0 -960 960 960"
                        width="16px"
                        fill="#475569"
                      >
                        <path d="M320-440l160-160 160 160H320Zm0 80h320L480-200 320-360Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    <div className={styles.thContent}>
                      Preço Unitário
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16px"
                        viewBox="0 -960 960 960"
                        width="16px"
                        fill="#475569"
                      >
                        <path d="M320-440l160-160 160 160H320Zm0 80h320L480-200 320-360Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    <div className={styles.thContent}>
                      Qtd. Itens
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16px"
                        viewBox="0 -960 960 960"
                        width="16px"
                        fill="#475569"
                      >
                        <path d="M320-440l160-160 160 160H320Zm0 80h320L480-200 320-360Z" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {itensVenda.map((item, index) => (
                  <tr key={index}>
                    <td className={styles.codeCell}>{item.codigo}</td>
                    <td>{item.precoTotal}</td>
                    <td>{item.precoUnitario}</td>
                    <td>{item.qtd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
