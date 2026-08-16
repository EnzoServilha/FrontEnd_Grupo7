import styles from "./Table.module.css";
import { useState } from "react";

function formatarData(data) {
  if (!data || !data.includes("/")) return data;
  const partes = data.split("/");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function Table(props) {
  const [linhas, setLinhas] = useState(props.rows);
  const [novaDirecao, setNovaDirecao] = useState(true);

  const [selecionadas, setSelecionadas] = useState([]);

  function handleSelectAll(event) {
    if (event.target.checked) {
      const todosIndices = linhas.map((linha, idx) => idx);
      setSelecionadas(todosIndices);
    } else {
      setSelecionadas([]);
    }
  }

  function handleSelectRow(index) {
    if (selecionadas.includes(index)) {
      setSelecionadas(selecionadas.filter((idx) => idx !== index));
    } else {
      setSelecionadas([...selecionadas, index]);
    }
  }

  function ordenacao(tipo, index) {
    let listaOrdenada = [...linhas];

    if (tipo === "number") {
      listaOrdenada.sort((a, b) => {
        const numA = parseFloat(a[index]) || 0;
        const numB = parseFloat(b[index]) || 0;
        return novaDirecao ? numA - numB : numB - numA;
      });
    } else if (tipo === "date") {
      listaOrdenada.sort((a, b) => {
        const dataA = new Date(formatarData(a[index]));
        const dataB = new Date(formatarData(b[index]));
        return novaDirecao ? dataA - dataB : dataB - dataA;
      });
    } else {
      listaOrdenada.sort((a, b) => {
        const strA = String(a[index]).toLowerCase();
        const strB = String(b[index]).toLowerCase();
        return novaDirecao
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    setNovaDirecao(!novaDirecao);
    setLinhas(listaOrdenada);
    setSelecionadas([]);
  }

  return (
    <div className={styles["table-container"]}>
      <table className={styles["custom-table"]}>
        <thead>
          <tr>
            <th>
              <input
                className={styles["custom-checkbox"]}
                type="checkbox"
                checked={
                  selecionadas.length === linhas.length && linhas.length > 0
                }
                onChange={handleSelectAll}
              />
            </th>
            {props.columns.map((column, index) => (
              <th
                key={index}
                style={{ cursor: column.ordena ? "pointer" : "default" }}
                onClick={() => column.ordena && ordenacao(column.tipo, index)}
              >
                <div className={styles["th-elements"]}>
                  {column.name}{" "}
                  {column.ordena &&
                    (novaDirecao ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#000000"
                      >
                        <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#000000"
                      >
                        <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                      </svg>
                    ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((row, index) => {
            const isSelected = selecionadas.includes(index);
            return (
              <tr
                key={index}
                className={isSelected ? styles["selected-row"] : ""}
              >
                <td>
                  <input
                    className={styles["custom-checkbox"]}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectRow(index)}
                  />
                </td>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
