import styles from "./Table.module.css";
import { useState, useMemo } from "react";

function formatarData(data) {
  if (!data || !data.includes("/")) return data;
  const partes = data.split("/");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function Table(props) {
  const [linhas, setLinhas] = useState(props.rows);
  const [novaDirecao, setNovaDirecao] = useState(true);

  const getRowId = useMemo(
    () => props.getRowId || ((row) => (Array.isArray(row) ? null : row?.id)),
    [props.getRowId]
  );

  const [selecionadasInternas, setSelecionadasInternas] = useState([]);
  const isControlled = props.selectedRows !== undefined;
  const selecionadas = isControlled ? props.selectedRows : selecionadasInternas;
  const setSelecionadas = isControlled ? props.onSelectionChange : setSelecionadasInternas;

  const idsVisiveis = useMemo(() => linhas.map(getRowId).filter((id) => id !== null), [linhas, getRowId]);

  function handleSelectAll(event) {
    if (event.target.checked) {
      setSelecionadas(idsVisiveis);
    } else {
      setSelecionadas([]);
    }
  }

  function handleSelectRow(rowId) {
    if (selecionadas.includes(rowId)) {
      setSelecionadas(selecionadas.filter((id) => id !== rowId));
    } else {
      setSelecionadas([...selecionadas, rowId]);
    }
  }

  function ordenacao(tipo, index) {
    let listaOrdenada = [...linhas];

    const getCellValue = (row, cellIndex) => {
      if (Array.isArray(row)) return row[cellIndex];
      return row?.cells?.[cellIndex];
    };

    if (tipo === "number") {
      listaOrdenada.sort((a, b) => {
        const numA = parseFloat(getCellValue(a, index)) || 0;
        const numB = parseFloat(getCellValue(b, index)) || 0;
        return novaDirecao ? numA - numB : numB - numA;
      });
    } else if (tipo === "date") {
      listaOrdenada.sort((a, b) => {
        const dataA = new Date(formatarData(getCellValue(a, index)));
        const dataB = new Date(formatarData(getCellValue(b, index)));
        return novaDirecao ? dataA - dataB : dataB - dataA;
      });
    } else {
      listaOrdenada.sort((a, b) => {
        const strA = String(getCellValue(a, index)).toLowerCase();
        const strB = String(getCellValue(b, index)).toLowerCase();
        return novaDirecao
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    setNovaDirecao(!novaDirecao);
    setLinhas(listaOrdenada);
    setSelecionadas([]);
  }

  const getCells = (row) => (Array.isArray(row) ? row : row?.cells || []);

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
                  idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionadas.includes(id))
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
            const rowId = getRowId(row);
            const isSelected = rowId !== null && selecionadas.includes(rowId);
            return (
              <tr
                key={rowId !== null ? rowId : index}
                className={isSelected ? styles["selected-row"] : ""}
              >
                <td>
                  <input
                    className={styles["custom-checkbox"]}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => rowId !== null && handleSelectRow(rowId)}
                  />
                </td>
                {getCells(row).map((cell, cellIndex) => (
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
