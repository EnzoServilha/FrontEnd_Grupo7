import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import styles from "./CadastrarPedido.module.css";
import HelpButton from "../helpfeat/HelpButton";

// Aceita array, Page do Spring ({ content }), DTO de cliente ({ conteudo })
// ou corpo vazio (resposta 204, em que data chega como "").
const extrairLista = (dados) =>
  Array.isArray(dados)
    ? dados
    : Array.isArray(dados?.content)
      ? dados.content
      : Array.isArray(dados?.conteudo)
        ? dados.conteudo
        : [];

const formularioInicial = {
  tipo: "compra",
  dataPrevista: "",
  observacoes: "",
  numeroNotaFiscal: "",
  precoImposto: "",
  precoFrete: "",
};

// O status não é enviado: o back define PENDENTE ao criar
const configuracaoTipo = {
  compra: { tipoId: 1 },
  cotacao: { tipoId: 4 },
};

const TIPO_ID_POR_NOME = { ENTRADA: 1, SAIDA: 2, COTACAO: 4 };
const ROTULO_TIPO = { ENTRADA: "Compra", SAIDA: "Venda", COTACAO: "Cotação" };

// /itens é paginado: pede uma página grande para o catálogo caber inteiro
const PARAMS_CATALOGO = { page: 0, size: 2000, sort: "codigoInterno,asc" };

// Aceita "12,5" e "12.5". Vazio vale 0; texto inválido vira NaN.
const lerNumero = (valor) => {
  const texto = String(valor ?? "").trim().replace(",", ".");
  return texto === "" ? 0 : Number(texto);
};

const nomeCliente = (cliente) =>
  cliente?.nomeEmpresa ?? cliente?.nome ?? cliente?.nomeContato ?? "";

const nomeFornecedor = (fornecedor) =>
  fornecedor?.nomeEmpresa ?? fornecedor?.razaoSocial ?? fornecedor?.nomeContato ?? "";

// Objeto do back -> { id, nome, contato } usado na busca de cliente/fornecedor
const contatoCliente = (cliente) =>
  cliente?.id != null
    ? { id: cliente.id, nome: nomeCliente(cliente), contato: cliente.nomeContato ?? "" }
    : null;

const contatoFornecedor = (fornecedor) =>
  fornecedor?.id != null
    ? { id: fornecedor.id, nome: nomeFornecedor(fornecedor), contato: fornecedor.nomeContato ?? "" }
    : null;

// ItensNaMovimentacaoResponseDto[] -> linhas da tabela do pedido
const itensDaMovimentacao = (lista) =>
  extrairLista(lista).map((i) => ({
    id: i.id, // id da linha em itens_na_movimentacao
    itemId: i.item.id,
    codigo: i.item.codigoInterno,
    quantidade: i.qtd,
    precoUnitario: i.precoUnitario,
    marca: i.item.marca ?? "---",
    novo: false,
  }));

// Venda pré-preenchida com os dados da cotação (o cliente vem da própria cotação)
const formularioDaCotacao = (cotacao) => ({
  tipo: "venda",
  dataPrevista: cotacao.dataEntregaPrevista ?? "",
  observacoes: cotacao.observacoes ?? "",
  numeroNotaFiscal: "",
  precoImposto: cotacao.totalGastoImpostos ?? "",
  precoFrete: cotacao.precoFrete ?? "",
});

// Formulário preenchido com o pedido que está sendo editado
const formularioDoPedido = (movimentacao) => ({
  tipo: movimentacao.tipo?.nome === "SAIDA" ? "venda" : "compra",
  dataPrevista: movimentacao.dataEntregaPrevista ?? "",
  observacoes: movimentacao.observacoes ?? "",
  numeroNotaFiscal: movimentacao.numeroNotaFiscal ?? "",
  precoImposto: movimentacao.totalGastoImpostos ?? "",
  precoFrete: movimentacao.precoFrete ?? "",
});

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));

/**
 * Executa os passos em sequência. Se algum falhar, desfaz os que já deram certo,
 * na ordem inversa, para que ou todas as chamadas valham ou nenhuma.
 * Cada passo: { executar(): Promise, desfazer?(resultado): Promise }
 *
 * O erro relançado recebe `desfeitoCompletamente` (true/false).
 */
async function executarAtomico(passos) {
  const desfazer = [];

  try {
    for (const passo of passos) {
      const resultado = await passo.executar();
      if (passo.desfazer) desfazer.push(() => passo.desfazer(resultado));
    }
  } catch (erro) {
    let desfeitoCompletamente = true;

    for (const compensar of desfazer.reverse()) {
      try {
        await compensar();
      } catch (erroAoDesfazer) {
        console.error("Falha ao desfazer uma etapa:", erroAoDesfazer);
        desfeitoCompletamente = false;
      }
    }

    erro.desfeitoCompletamente = desfeitoCompletamente;
    throw erro;
  }
}

const mensagemDeErro = (error) => {
  const motivo = error.response?.data?.message ?? "Não foi possível salvar o pedido.";

  if (error.desfeitoCompletamente === false) {
    return `${motivo} A reversão automática ficou incompleta: recarregue a página e confira o pedido antes de tentar de novo.`;
  }
  if (error.pedidoCancelado) {
    return `${motivo} Nenhuma peça foi salva e o pedido criado foi cancelado automaticamente.`;
  }
  if (error.desfeitoCompletamente === true) {
    return `${motivo} Nenhuma alteração foi salva.`;
  }
  return motivo;
};

/**
 * Barra de pesquisa para escolher um cliente ou um fornecedor.
 * A lista vem do back conforme o usuário digita (nome da empresa ou do contato).
 * Só vale o contato escolhido na lista: ao digitar de novo, a escolha anterior é desfeita.
 *
 * tipo:         "cliente" | "fornecedor"
 * selecionado:  { id, nome, contato } | null
 * onSelecionar: (contato | null) => void
 */
function BuscaContato({ id, rotulo, tipo, selecionado, onSelecionar, placeholder }) {
  const [busca, setBusca] = useState(selecionado?.nome ?? "");
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // Pedido em edição: mostra o contato que já estava salvo
  useEffect(() => {
    if (selecionado) setBusca(selecionado.nome);
  }, [selecionado]);

  useEffect(() => {
    if (selecionado || !aberto) {
      setSugestoes([]);
      return undefined;
    }

    const termo = busca.trim();
    let cancelado = false;

    const buscar = async () => {
      const url = tipo === "cliente" ? "/clientes/buscar" : "/fornecedores/buscar";
      const normalizar = tipo === "cliente" ? contatoCliente : contatoFornecedor;

      // Sem texto lista todos; com texto procura pela empresa e pelo contato
      const consultas = termo ? [{ nomeEmpresa: termo }, { nomeContato: termo }] : [{}];

      const respostas = await Promise.all(
        consultas.map((params) =>
          api
            .get(url, { params })
            .then((resposta) => extrairLista(resposta.data))
            .catch((error) => {
              console.error(`Erro ao buscar em ${url}:`, error);
              return null;
            }),
        ),
      );

      if (cancelado) return;

      if (respostas.every((resposta) => resposta === null)) {
        setFalhou(true);
        setSugestoes([]);
        return;
      }

      setFalhou(false);

      // O mesmo contato pode vir nas duas buscas: deduplica pelo id
      const unicos = new Map();
      respostas
        .filter(Boolean)
        .flat()
        .filter((item) => item?.ativo !== false)
        .map(normalizar)
        .filter(Boolean)
        .forEach((contato) => unicos.set(contato.id, contato));

      setSugestoes([...unicos.values()].slice(0, 8));
    };

    const timer = setTimeout(buscar, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca, selecionado, aberto, tipo]);

  const escolher = (contato) => {
    onSelecionar(contato);
    setBusca(contato.nome);
    setAberto(false);
  };

  return (
    <label className={styles.selectField} htmlFor={id}>
      <span>{rotulo}</span>
      <div className={styles.contatoBusca}>
        <input
          id={id}
          type="text"
          className={styles.contatoInput}
          autoComplete="off"
          value={busca}
          placeholder={placeholder}
          onChange={(event) => {
            setBusca(event.target.value);
            onSelecionar(null);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
          // Enter dentro do <form> enviaria o pedido sem querer
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />

        {aberto && !selecionado && (
          <div
            className={styles.contatoLista}
            role="listbox"
            aria-label={tipo === "cliente" ? "Clientes encontrados" : "Fornecedores encontrados"}
            // Mantém o foco no campo para o clique na opção não ser perdido pelo onBlur
            onMouseDown={(event) => event.preventDefault()}
          >
            {falhou ? (
              <p className={styles.contatoVazio}>Não foi possível buscar. Tente novamente.</p>
            ) : sugestoes.length === 0 ? (
              <p className={styles.contatoVazio}>Nenhum resultado encontrado.</p>
            ) : (
              sugestoes.map((contato) => (
                <button
                  key={contato.id}
                  type="button"
                  className={styles.contatoOpcao}
                  onClick={() => escolher(contato)}
                >
                  <strong>{contato.nome}</strong>
                  {contato.contato && <small>{contato.contato}</small>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </label>
  );
}

function CadastrarPedido() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Modos da página:
  // - cadastro: sem state
  // - venda:    state.cotacaoId (conclusão de uma cotação)
  // - edição:   state.pedidoId  (edição de um pedido pendente)
  const cotacaoId = state?.cotacaoId ?? null;
  const pedidoId = state?.pedidoId ?? null;
  const modoVenda = cotacaoId !== null;
  const modoEdicao = !modoVenda && pedidoId !== null;
  const origemId = modoVenda ? cotacaoId : pedidoId;

  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [pesquisaPeca, setPesquisaPeca] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [itensPedido, setItensPedido] = useState([]);
  const [itensOriginais, setItensOriginais] = useState([]); // só na edição
  const [itensDisponiveis, setItensDisponiveis] = useState([]);
  const [periodoAtual, setPeriodoAtual] = useState(null);
  const [movimentacaoOrigem, setMovimentacaoOrigem] = useState(null); // cotação (venda) ou pedido (edição)
  const [bloqueado, setBloqueado] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Tipo efetivo do pedido: define quais campos aparecem e quais são obrigatórios
  const tipoPedido = modoVenda
    ? "SAIDA"
    : modoEdicao
      ? movimentacaoOrigem?.tipo?.nome
      : formulario.tipo === "cotacao"
        ? "COTACAO"
        : "ENTRADA";

  const rotuloTipo = ROTULO_TIPO[tipoPedido] ?? "---";
  const exigeCliente = tipoPedido === "COTACAO"; // só na criação da cotação
  const exigeFornecedor = tipoPedido === "ENTRADA"; // compra (cadastro ou edição)
  const mostraCliente = tipoPedido === "COTACAO" || tipoPedido === "SAIDA";
  const mostraFornecedor = tipoPedido === "ENTRADA";

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregandoItens(true);

        const temOrigem = origemId !== null;

        const [
          respostaPeriodo,
          respostaItens,
          respostaMovimentacao,
          respostaItensMovimentacao,
        ] = await Promise.all([
          api.get("/periodos/ultimo"),
          api.get("/itens", { params: PARAMS_CATALOGO }),
          temOrigem ? api.get(`/movimentacoes/${origemId}`) : Promise.resolve(null),
          temOrigem
            ? api.get(`/itensNaMovimentacao/movimentacao/${origemId}`)
            : Promise.resolve(null),
        ]);

        // /itens devolve uma Page ({ content }) ou 204 sem corpo: extrairLista cobre os dois
        const itens = extrairLista(respostaItens.data).filter((item) => item.ativo !== false);

        setPeriodoAtual(respostaPeriodo.data ?? null);

        if (!respostaMovimentacao) {
          setItensDisponiveis(itens);
          return;
        }

        const movimentacao = respostaMovimentacao.data;
        const itensDaOrigem = itensDaMovimentacao(respostaItensMovimentacao?.data);

        setMovimentacaoOrigem(movimentacao);

        if (modoVenda) {
          const idsCotados = new Set(itensDaOrigem.map((item) => item.itemId));

          setFormulario(formularioDaCotacao(movimentacao));
          setItensPedido(itensDaOrigem);
          // Na venda só podem ser usadas peças que estão na cotação
          setItensDisponiveis(itens.filter((item) => idsCotados.has(item.id)));
          return;
        }

        // Edição: só pedidos pendentes, que não sejam cotação
        if (movimentacao.tipo?.nome === "COTACAO" || movimentacao.status?.nome !== "PENDENTE") {
          setBloqueado(true);
          setErro("Somente pedidos pendentes, que não sejam cotações, podem ser editados.");
        }

        setFormulario(formularioDoPedido(movimentacao));
        setClienteSelecionado(contatoCliente(movimentacao.cliente));
        setFornecedorSelecionado(contatoFornecedor(movimentacao.fornecedor));
        setItensPedido(itensDaOrigem);
        setItensOriginais(itensDaOrigem);
        setItensDisponiveis(itens);
      } catch (error) {
        console.error("Erro ao carregar dados do pedido:", error);
        setItensDisponiveis([]);
        if (origemId !== null) {
          setBloqueado(true);
          setErro(
            modoVenda
              ? "Não foi possível carregar a cotação para gerar a venda."
              : "Não foi possível carregar o pedido para edição.",
          );
        }
      } finally {
        setCarregandoItens(false);
      }
    };

    carregarDados();
  }, [origemId, modoVenda]);

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
    const qtd = lerNumero(quantidade);
    const preco = lerNumero(precoUnitario);

    if (!termo) {
      setErro("Informe o código interno da peça.");
      return;
    }

    const termoMinusculo = termo.toLowerCase();

    // Primeiro o código exato (ou ID); se não houver, aceita um único resultado parcial
    let itemSelecionado = itensDisponiveis.find((item) => {
      const codigo = String(item?.codigoInterno ?? "").trim().toLowerCase();
      return codigo === termoMinusculo || String(item?.id) === termo;
    });

    if (!itemSelecionado) {
      const parciais = itensDisponiveis.filter((item) =>
        String(item?.codigoInterno ?? "").toLowerCase().includes(termoMinusculo),
      );
      if (parciais.length === 1) itemSelecionado = parciais[0];
    }

    if (!itemSelecionado) {
      setErro(
        modoVenda
          ? "Peça não pertence à cotação. Verifique o código interno informado."
          : "Peça não encontrada. Verifique o código interno ou ID informado.",
      );
      return;
    }

    if (!Number.isInteger(qtd) || qtd <= 0 || !Number.isFinite(preco) || preco < 0) {
      setErro("Informe uma quantidade inteira válida e um preço unitário válido.");
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

      // Peça que já estava no pedido, foi removida e voltou: reaproveita a linha original
      // (evita tentar criar de novo uma linha que o back ainda tem)
      const original = itensOriginais.find((o) => o.itemId === itemSelecionado.id);
      if (original) {
        return [...itensAtuais, { ...original, quantidade: qtd, precoUnitario: preco }];
      }

      return [
        ...itensAtuais,
        {
          id: `novo-${Date.now()}`,
          itemId: itemSelecionado.id,
          codigo: itemSelecionado.codigoInterno,
          quantidade: qtd,
          precoUnitario: preco,
          marca: itemSelecionado.marca ?? "---",
          novo: true,
        },
      ];
    });

    setErro("");
    setPesquisaPeca("");
    setQuantidade("");
    setPrecoUnitario("");
  };

  const removerItem = (itemId) => {
    setItensPedido((itensAtuais) =>
      itensAtuais.filter((item) => item.itemId !== itemId),
    );
  };

  const corpoItem = (movimentacaoId, item) => ({
    movimentacaoEstoqueId: movimentacaoId,
    itemId: item.itemId,
    qtd: Number(item.quantidade),
    precoUnitario: Number(item.precoUnitario),
  });

  const montarCorpoMovimentacao = (periodoId, tipoId) => ({
    totalGastoImpostos: lerNumero(formulario.precoImposto),
    precoFrete: lerNumero(formulario.precoFrete),
    dataEntregaPrevista: formulario.dataPrevista || null,
    // Pedido novo: o back preenche a entrega ao concluir. Edição: mantém o que já existe.
    dataEntrega: modoEdicao ? (movimentacaoOrigem?.dataEntrega ?? null) : null,
    observacoes: formulario.observacoes?.trim() || null,
    tipoId,
    // null = o back mantém o que já está gravado (saída herda o cliente da cotação)
    clienteId: exigeCliente ? (clienteSelecionado?.id ?? null) : null,
    fornecedorId: exigeFornecedor ? (fornecedorSelecionado?.id ?? null) : null,
    movimentacaoOriginalId: null,
    numeroNotaFiscal: formulario.numeroNotaFiscal?.trim() || null,
    periodoId,
  });

  const validarFormulario = () => {
    if (exigeCliente && !clienteSelecionado) {
      return "Selecione o cliente da cotação na lista de resultados da busca.";
    }
    if (exigeFornecedor && !fornecedorSelecionado) {
      return "Selecione o fornecedor da compra na lista de resultados da busca.";
    }

    const imposto = lerNumero(formulario.precoImposto);
    const frete = lerNumero(formulario.precoFrete);
    if (!Number.isFinite(imposto) || imposto < 0 || !Number.isFinite(frete) || frete < 0) {
      return "Informe valores válidos (maiores ou iguais a zero) para imposto e frete.";
    }

    return "";
  };

  // Cadastro: cria o pedido e depois os itens. Se algo falhar, desfaz tudo
  // (apaga os itens criados e cancela o pedido, que a API não permite apagar).
  const criarPedido = async (periodoId) => {
    const tipoSelecionado = configuracaoTipo[formulario.tipo] ?? configuracaoTipo.compra;
    let movimentacaoId = null;

    try {
      await executarAtomico([
        {
          executar: async () => {
            const resposta = await api.post(
              "/movimentacoes",
              montarCorpoMovimentacao(periodoId, tipoSelecionado.tipoId),
            );
            movimentacaoId = resposta.data?.id;
            if (!movimentacaoId) {
              throw new Error("Movimentação criada sem identificador válido");
            }
          },
          desfazer: () =>
            api.patch("/movimentacoes/status", { ids: [movimentacaoId], acao: "CANCELAR" }),
        },
        ...itensPedido.map((item) => ({
          executar: () => api.post("/itensNaMovimentacao", corpoItem(movimentacaoId, item)),
          desfazer: (resposta) => api.delete(`/itensNaMovimentacao/${resposta.data.id}`),
        })),
      ]);
    } catch (error) {
      if (movimentacaoId && error.desfeitoCompletamente) error.pedidoCancelado = true;
      throw error;
    }
  };

  // Edição: itens (novos, alterados, removidos) e, por último, o pedido.
  // O PUT do pedido vai por último porque o back não permite desfazê-lo
  // (valores nulos são ignorados); assim, se ele falhar, os itens voltam ao que eram.
  const salvarEdicao = async (periodoId) => {
    const idsAtuais = new Set(
      itensPedido.filter((item) => !item.novo).map((item) => item.id),
    );

    const novos = itensPedido.filter((item) => item.novo);
    const removidos = itensOriginais.filter((original) => !idsAtuais.has(original.id));
    const alterados = itensPedido
      .filter((item) => !item.novo)
      .map((item) => ({ item, original: itensOriginais.find((o) => o.id === item.id) }))
      .filter(
        ({ item, original }) =>
          original &&
          (Number(original.quantidade) !== Number(item.quantidade) ||
            Number(original.precoUnitario) !== Number(item.precoUnitario)),
      );

    const passos = [];

    novos.forEach((item) =>
      passos.push({
        executar: () => api.post("/itensNaMovimentacao", corpoItem(pedidoId, item)),
        desfazer: (resposta) => api.delete(`/itensNaMovimentacao/${resposta.data.id}`),
      }),
    );

    alterados.forEach(({ item, original }) =>
      passos.push({
        executar: () => api.put(`/itensNaMovimentacao/${item.id}`, corpoItem(pedidoId, item)),
        desfazer: () =>
          api.put(`/itensNaMovimentacao/${item.id}`, corpoItem(pedidoId, original)),
      }),
    );

    removidos.forEach((item) =>
      passos.push({
        executar: () => api.delete(`/itensNaMovimentacao/${item.id}`),
        desfazer: () => api.post("/itensNaMovimentacao", corpoItem(pedidoId, item)),
      }),
    );

    passos.push({
      executar: () =>
        api.put(
          `/movimentacoes/${pedidoId}`,
          montarCorpoMovimentacao(
            periodoId,
            TIPO_ID_POR_NOME[movimentacaoOrigem?.tipo?.nome] ?? null,
          ),
        ),
    });

    await executarAtomico(passos);
  };

  const cadastrarPedido = async (event) => {
    event.preventDefault();

    if (bloqueado || salvando) return;

    // Na edição o período é o do próprio pedido; nos demais, o período aberto
    const periodoId = modoEdicao
      ? (movimentacaoOrigem?.periodo?.id ?? periodoAtual?.id)
      : periodoAtual?.id;

    if (!periodoId) {
      setErro("Não foi possível localizar o período aberto do estoque.");
      return;
    }

    const erroFormulario = validarFormulario();
    if (erroFormulario) {
      setErro(erroFormulario);
      setEtapa(1);
      return;
    }

    if (itensPedido.length === 0) {
      setErro(
        modoVenda
          ? "A venda precisa ter pelo menos uma peça."
          : "Adicione pelo menos uma peça ao pedido antes de cadastrar.",
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      if (modoEdicao) {
        await salvarEdicao(periodoId);
      } else if (modoVenda) {
        // Uma única chamada transacional no back: cria a saída PENDENTE, salva os itens
        // e define o status final da cotação (parcial ou completa).
        await api.post(`/movimentacoes/cotacoes/${cotacaoId}/fechamento`, {
          periodoId,
          totalGastoImpostos: lerNumero(formulario.precoImposto),
          precoFrete: lerNumero(formulario.precoFrete),
          dataEntregaPrevista: formulario.dataPrevista || null,
          observacoes: formulario.observacoes?.trim() || null,
          numeroNotaFiscal: formulario.numeroNotaFiscal?.trim() || null,
          itens: itensPedido.map((item) => ({
            itemId: item.itemId,
            qtd: Number(item.quantidade),
            precoUnitario: Number(item.precoUnitario),
          })),
        });
      } else {
        await criarPedido(periodoId);
      }

      navigate(-1);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
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

  const titulo = modoVenda ? "Nova Venda" : modoEdicao ? "Editar Pedido" : "Novo Pedido";
  const textoSubmit = modoVenda ? "Gerar Venda" : modoEdicao ? "Salvar" : "Cadastrar";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <h1>{titulo}</h1>

        <div className={styles.helpAction}>
          <HelpButton />
        </div>
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
                    {!modoVenda && !modoEdicao ? (
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
                    ) : (
                      // O tipo não muda na venda nem na edição
                      <div className={styles.readOnlyField}>
                        <span>Tipo:</span>
                        <strong>{rotuloTipo}</strong>
                      </div>
                    )}

                    {mostraCliente &&
                      (exigeCliente ? (
                        <BuscaContato
                          id="cliente-pedido"
                          rotulo="Cliente:"
                          tipo="cliente"
                          selecionado={clienteSelecionado}
                          onSelecionar={setClienteSelecionado}
                          placeholder="Busque pelo nome da empresa ou do contato"
                        />
                      ) : (
                        // Na saída o cliente é o da cotação de origem e não muda
                        <div className={styles.readOnlyField}>
                          <span>Cliente:</span>
                          <strong>{nomeCliente(movimentacaoOrigem?.cliente) || "---"}</strong>
                        </div>
                      ))}

                    {mostraFornecedor && (
                      <BuscaContato
                        id="fornecedor-pedido"
                        rotulo="Fornecedor:"
                        tipo="fornecedor"
                        selecionado={fornecedorSelecionado}
                        onSelecionar={setFornecedorSelecionado}
                        placeholder="Busque pelo nome da empresa ou do contato"
                      />
                    )}

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

                {erro && <p className={styles.errorMessage}>{erro}</p>}

                <div className={styles.cardActionsRight}>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <Button type="button" estilo="cinza" onClick={() => navigate(-1)}>
                      Cancelar
                    </Button>
                    <Button type="button" estilo="editar" onClick={() => setEtapa(2)}>
                      Próximo
                    </Button>
                  </div>
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
                      // Enter dentro do <form> enviaria o pedido sem querer
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.preventDefault();
                      }}
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
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensPedido.map((item) => (
                        <tr key={item.id}>
                          <td>{item.codigo}</td>
                          <td>{item.quantidade}</td>
                          <td>{formatarMoeda(item.precoUnitario)}</td>
                          <td>
                            {formatarMoeda(
                              Number(item.quantidade) * Number(item.precoUnitario),
                            )}
                          </td>
                          <td>{item.marca}</td>
                          <td>
                            <Button
                              type="button"
                              estilo="deletar"
                              onClick={() => removerItem(item.itemId)}
                            >
                              Remover
                            </Button>
                          </td>
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
                    <Button type="submit" disabled={bloqueado || carregandoItens || salvando}>
                      {salvando ? "Salvando..." : textoSubmit}
                    </Button>
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