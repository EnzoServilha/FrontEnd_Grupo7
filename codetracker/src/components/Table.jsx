import styles from "./Table.module.css";
import { useEffect, useRef, useState } from "react";

function formatarData(data) {
  if (!data || !data.includes("/")) return data;
  const partes = data.split("/");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function Table(props) {
  // Id de cada linha: prioriza rowIds (se vier), depois row.id, depois o índice.
  const resolverId = (row, idx) => props.rowIds?.[idx] ?? row?.id ?? idx;

  // Pair each row with its id up front, so sorting never desyncs them.
  const buildLinhas = () =>
    (props.rows ?? []).map((row, idx) => ({
      id: resolverId(row, idx),
      cells: Array.isArray(row) ? row : row?.cells || [],
    }));

  // A "chave" precisa refletir o conteúdo real de rows, não só rowIds —
  // caso contrário, quando rowIds nunca é passado (fica undefined sempre),
  // a chave nunca muda e o effect abaixo nunca roda.
  const computarChave = () =>
    (props.rows ?? []).map((row, idx) => resolverId(row, idx)).join("|");

  const [linhas, setLinhas] = useState(buildLinhas);
  const [novaDirecao, setNovaDirecao] = useState(true);
  const [selecionadas, setSelecionadas] = useState([]);
  const chaveLinhasRef = useRef(computarChave());

  useEffect(() => {
    const proximaChave = computarChave();

    if (proximaChave !== chaveLinhasRef.current) {
      setLinhas(buildLinhas());
      setSelecionadas([]);

      if (props.onSelectionChange) {
        props.onSelectionChange([]);
      }

      chaveLinhasRef.current = proximaChave;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.rowIds, props.rows, props.onSelectionChange]);

  function notificarSelecao(proximasSelecionadas) {
    if (props.onSelectionChange) {
      props.onSelectionChange(proximasSelecionadas);
    }
  }

  const idsVisiveis = linhas.map((linha) => linha.id);

  function handleSelectAll(event) {
    if (event.target.checked) {
      setSelecionadas(idsVisiveis);
      notificarSelecao(idsVisiveis);
    } else {
      setSelecionadas([]);
      notificarSelecao([]);
    }
  }

  function handleSelectRow(rowId) {
    const proximasSelecionadas = selecionadas.includes(rowId)
      ? selecionadas.filter((id) => id !== rowId)
      : [...selecionadas, rowId];

    setSelecionadas(proximasSelecionadas);
    notificarSelecao(proximasSelecionadas);
  }

  function ordenacao(tipo, index) {
    const listaOrdenada = [...linhas];

    if (tipo === "number") {
      listaOrdenada.sort((a, b) => {
        const numA = parseFloat(a.cells[index]) || 0;
        const numB = parseFloat(b.cells[index]) || 0;
        return novaDirecao ? numA - numB : numB - numA;
      });
    } else if (tipo === "date") {
      listaOrdenada.sort((a, b) => {
        const dataA = new Date(formatarData(a.cells[index]));
        const dataB = new Date(formatarData(b.cells[index]));
        return novaDirecao ? dataA - dataB : dataB - dataA;
      });
    } else {
      listaOrdenada.sort((a, b) => {
        const strA = String(a.cells[index]).toLowerCase();
        const strB = String(b.cells[index]).toLowerCase();
        return novaDirecao
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    setNovaDirecao(!novaDirecao);
    setLinhas(listaOrdenada);
    setSelecionadas([]);
    notificarSelecao([]);
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
                  idsVisiveis.length > 0 &&
                  idsVisiveis.every((id) => selecionadas.includes(id))
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
          {linhas.map((linha) => {
            const isSelected = selecionadas.includes(linha.id);
            return (
              <tr
                key={linha.id}
                className={isSelected ? styles["selected-row"] : ""}
              >
                <td>
                  <input
                    className={styles["custom-checkbox"]}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectRow(linha.id)}
                  />
                </td>
                {linha.cells.map((cell, cellIndex) => (
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