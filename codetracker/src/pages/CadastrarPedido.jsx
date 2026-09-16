import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import styles from "./CadastrarPedido.module.css";

const formularioInicial = {
  tipo: "compra",
  dataPedido: "",
  dataPrevista: "",
  observacoes: "",
  numeroNotaFiscal: "",
  precoImposto: "",
  precoFrete: "",
};

const configuracaoTipo = {
  compra: { tipoId: 1, statusId: 1 },
  cotacao: { tipoId: 4, statusId: 1 },
};

function CadastrarPedido() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [pesquisaPeca, setPesquisaPeca] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [itensDisponiveis, setItensDisponiveis] = useState([]);
  const [periodoAtual, setPeriodoAtual] = useState(null);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregandoItens(true);

        const [respostaPeriodo, respostaItens] = await Promise.all([
          api.get("/periodos/ultimo"),
          api.get("/itens"),
        ]);

        setPeriodoAtual(respostaPeriodo.data ?? null);
        setItensDisponiveis(Array.isArray(respostaItens.data) ? respostaItens.data : []);
      } catch (error) {
        console.error("Erro ao carregar dados do pedido:", error);
        setItensDisponiveis([]);
      } finally {
        setCarregandoItens(false);
      }
    };

    carregarDados();
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = pesquisaPeca.trim().toLowerCase();

    if (!termo) {
      return itensDisponiveis.slice(0, 5);
    }

    return itensDisponiveis.filter((item) => {
      const codigo = String(item?.codigoInterno ?? "").toLowerCase();
      const marca = String(item?.marca ?? "").toLowerCase();
      return codigo.includes(termo) || marca.includes(termo);
    }).slice(0, 5);
  }, [itensDisponiveis, pesquisaPeca]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const adicionarItem = () => {
    const termo = pesquisaPeca.trim();
    const qtd = Number(quantidade);
    const preco = Number(precoUnitario);

    if (!termo) {
      setErro("Informe o código interno da peça.");
      return;
    }

    const itemSelecionado = itensDisponiveis.find((item) => {
      const codigo = String(item?.codigoInterno ?? "").trim().toLowerCase();
      return codigo === termo.toLowerCase() || String(item?.id) === termo;
    });

    if (!itemSelecionado) {
      setErro("Peça não encontrada. Verifique o código interno ou ID informado.");
      return;
    }

    if (!Number.isFinite(qtd) || qtd <= 0 || !Number.isFinite(preco) || preco < 0) {
      setErro("Informe uma quantidade válida e um preço unitário válido.");
      return;
    }

    setItensPedido((itensAtuais) => {
      const existente = itensAtuais.find((item) => item.itemId === itemSelecionado.id);

      if (existente) {
        return itensAtuais.map((item) =>
          item.itemId === itemSelecionado.id
            ? { ...item, quantidade: qtd, precoUnitario: preco }
            : item,
        );
      }

      return [
        ...itensAtuais,
        {
          id: Date.now(),
          itemId: itemSelecionado.id,
          codigo: itemSelecionado.codigoInterno,
          quantidade: qtd,
          precoUnitario: preco,
          marca: itemSelecionado.marca ?? "---",
        },
      ];
    });

    setErro("");
    setPesquisaPeca("");
    setQuantidade("");
    setPrecoUnitario("");
  };

  const cadastrarPedido = async (event) => {
    event.preventDefault();

    if (!periodoAtual?.id) {
      setErro("Não foi possível localizar o período aberto do estoque.");
      return;
    }

    if (itensPedido.length === 0) {
      setErro("Adicione pelo menos uma peça ao pedido antes de cadastrar.");
      return;
    }

    const tipoSelecionado = configuracaoTipo[formulario.tipo] ?? configuracaoTipo.compra;

    const payloadMovimentacao = {
      totalGastoImpostos: Number(formulario.precoImposto || 0),
      precoFrete: Number(formulario.precoFrete || 0),
      dataEntregaPrevista: formulario.dataPrevista || null,
      dataEntrega: formulario.dataPedido || null,
      observacoes: formulario.observacoes?.trim() || null,
      tipoId: tipoSelecionado.tipoId,
      statusId: tipoSelecionado.statusId,
      clienteId: null,
      fornecedorId: null,
      movimentacaoOriginalId: null,
      numeroNotaFiscal: formulario.numeroNotaFiscal?.trim() || null,
      periodoId: periodoAtual.id,
    };

    try {
      const respostaMovimentacao = await api.post("/movimentacoes", payloadMovimentacao);
      const movimentacaoId = respostaMovimentacao.data?.id;

      if (!movimentacaoId) {
        throw new Error("Movimentação criada sem identificador válido");
      }

      await Promise.all(
        itensPedido.map((item) =>
          api.post("/itensNaMovimentacao", {
            movimentacaoEstoqueId: movimentacaoId,
            itemId: item.itemId,
            qtd: Number(item.quantidade),
            precoUnitario: Number(item.precoUnitario),
          }),
        ),
      );

      navigate(-1);
    } catch (error) {
      console.error("Erro ao cadastrar pedido:", error);
      setErro("Não foi possível concluir o cadastro do pedido. Revise os dados e tente novamente.");
    }
  };

  const passos = [
    {
      label: "Informações Gerais",
      color: etapa === 1 ? "#0056cb" : "#60a5fa",
      textColor: "#ffffff",
    },
    {
      label: "Peças",
      color: etapa === 2 ? "#0056cb" : "#e2e8f0",
      textColor: etapa === 2 ? "#ffffff" : "#64748b",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <h1>Novo Pedido</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.progressWrapper}>
          <ProgressoCadastro
            passos={passos}
            lineColor={etapa === 2 ? "#60a5fa" : "#e2e8f0"}
          />
        </div>

        <form className={styles.form} onSubmit={cadastrarPedido}>
          <section
            className={`${styles.card} ${etapa === 2 ? styles.cardPedido : ""}`}
            aria-labelledby={etapa === 1 ? "titulo-informacoes" : "titulo-pecas"}
          >
            {etapa === 1 ? (
              <>
                <h2 id="titulo-informacoes">Informações Gerais</h2>

                <div className={styles.generalGrid}>
                  <div className={styles.column}>
                    <fieldset className={styles.tipoPedido}>
                      <legend>Tipo:</legend>
                      <label>
                        <input
                          type="radio"
                          name="tipo-pedido"
                          value="compra"
                          checked={formulario.tipo === "compra"}
                          onChange={atualizarCampo("tipo")}
                        />
                        Compra
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="tipo-pedido"
                          value="cotacao"
                          checked={formulario.tipo === "cotacao"}
                          onChange={atualizarCampo("tipo")}
                        />
                        Cotação
                      </label>
                    </fieldset>

                    <Input
                      id="numero-nota-fiscal"
                      label="N° Nota Fiscal:"
                      value={formulario.numeroNotaFiscal}
                      onChange={atualizarCampo("numeroNotaFiscal")}
                      placeholder="Digite o número da nota fiscal"
                    />

                    <Input
                      id="preco-imposto"
                      label="Preço do Imposto:"
                      value={formulario.precoImposto}
                      onChange={atualizarCampo("precoImposto")}
                      placeholder="Digite o preço do imposto"
                    />

                    <Input
                      id="preco-frete"
                      label="Preço Gasto Frete:"
                      value={formulario.precoFrete}
                      onChange={atualizarCampo("precoFrete")}
                      placeholder="Digite o valor do frete"
                    />
                  </div>

                  <div className={styles.columnRight}>
                    <Input
                      id="data-pedido"
                      label="Data do Pedido:"
                      type="date"
                      value={formulario.dataPedido}
                      onChange={atualizarCampo("dataPedido")}
                    />

                    <Input
                      id="data-prevista"
                      label="Data Prevista Entrega:"
                      type="date"
                      value={formulario.dataPrevista}
                      onChange={atualizarCampo("dataPrevista")}
                    />

                    <label className={styles.textareaField} htmlFor="observacoes-pedido">
                      <span>Observações:</span>
                      <textarea
                        id="observacoes-pedido"
                        value={formulario.observacoes}
                        onChange={atualizarCampo("observacoes")}
                        placeholder="Digite a descrição"
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.cardActionsRight}>
                  <Button type="button" estilo="editar" onClick={() => setEtapa(2)}>
                    Próximo
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="titulo-pecas">Peças</h2>

                <div className={styles.inventoryGrid}>
                  <div className={styles.searchField}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                    <input
                      type="text"
                      value={pesquisaPeca}
                      onChange={(event) => setPesquisaPeca(event.target.value)}
                      placeholder="Busque pelo código interno da peça"
                    />
                  </div>

                  {carregandoItens ? (
                    <p className={styles.errorMessage}>Carregando peças...</p>
                  ) : itensDisponiveis.length > 0 ? (
                    <div className={styles.suggestionList}>
                      {itensFiltrados.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={styles.suggestionItem}
                          onClick={() => {
                            setPesquisaPeca(item.codigoInterno);
                            setErro("");
                          }}
                        >
                          {item.codigoInterno} · {item.marca ?? "---"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.errorMessage}>Nenhuma peça disponível para este pedido.</p>
                  )}

                  <div className={styles.inlineInputs}>
                    <Input
                      id="preco-unitario"
                      label="Preço Unitário:"
                      value={precoUnitario}
                      onChange={(event) => setPrecoUnitario(event.target.value)}
                      placeholder="Digite o preço da peça pedida"
                    />

                    <Input
                      id="quantidade-item"
                      label="Quantidade:"
                      value={quantidade}
                      onChange={(event) => setQuantidade(event.target.value)}
                      placeholder="Digite a quantidade da peça"
                    />
                  </div>

                  <div className={styles.addButton}>
                    <Button type="button" onClick={adicionarItem}>
                      Adicionar
                    </Button>
                  </div>
                </div>

                {erro && <p className={styles.errorMessage}>{erro}</p>}

                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Código Interno</th>
                        <th>Quantidade Solicitada</th>
                        <th>Preço Unitário</th>
                        <th>Preço Total</th>
                        <th>Marca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensPedido.map((item) => (
                        <tr key={item.id}>
                          <td>{item.codigo}</td>
                          <td>{item.quantidade}</td>
                          <td>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(item.precoUnitario))}
                          </td>
                          <td>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(item.quantidade) * Number(item.precoUnitario))}
                          </td>
                          <td>{item.marca}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.footerActions}>
                  <Button type="button" estilo="cinza" onClick={() => setEtapa(1)}>
                    Anterior
                  </Button>
                  <div className={styles.footerRight}>
                    <Button type="button" estilo="cinza" onClick={() => navigate(-1)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Cadastrar</Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </form>
      </main>
    </div>
  );
}

export default CadastrarPedido;
