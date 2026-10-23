import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import ServerResponse from "../components/ServerResponse";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarPeca.module.css";

const formularioInicial = {
  ano: "",
  marca: "",
  codigoInterno: "",
  localizacao: "",
  descricao: "",
};

const formatarContatoLabel = (contato) => {
  if (!contato) return "Contato não selecionado";

  const nomeEmpresa =
    contato.nomeEmpresa || contato.razaoSocial || contato.empresa || "Contato";
  const nomeContato = contato.nomeContato || contato.contato || "Sem contato";

  return `${nomeEmpresa} • ${nomeContato}`;
};

const normalizarContato = (contato, tipo) => {
  if (!contato || typeof contato !== "object") return null;

  const tipoEntidade = String(contato.tipoEntidade || "").toUpperCase();
  const tipoFinal =
    tipoEntidade === "CLIENTE"
      ? "Cliente"
      : tipoEntidade === "FORNECEDOR"
        ? "Fornecedor"
        : tipo === "cliente"
          ? "Cliente"
          : "Fornecedor";

  const nomeEmpresa =
    contato.nomeEmpresa || contato.nome || contato.razaoSocial || contato.empresa || "";
  const nomeContato = contato.nomeContato || contato.contato || "";

  const empresaValida = nomeEmpresa.trim();
  const contatoValido = nomeContato.trim();

  if (!contato.id && !empresaValida && !contatoValido) {
    return null;
  }

  const nomeEmpresaFinal = empresaValida || tipoFinal;
  const nomeContatoFinal = contatoValido || "Sem contato";

  return {
    id: contato.id,
    tipo: tipoFinal,
    nomeEmpresa: nomeEmpresaFinal,
    nomeContato: nomeContatoFinal,
    label: `${nomeEmpresaFinal} • ${nomeContatoFinal}`,
  };
};

const normalizarItemEdicao = (item) => {
  if (!item || typeof item !== "object") return null;

  const codigosAssociados = Array.isArray(item.codigosAssociados)
    ? item.codigosAssociados.map((codigo) => {
        const cliente = codigo?.cliente;
        const fornecedor = codigo?.fornecedor;
        const nomeEmpresa =
          cliente?.nome ??
          cliente?.razaoSocial ??
          fornecedor?.razaoSocial ??
          fornecedor?.nome ??
          "Contato";
        const nomeContato =
          cliente?.nomeContato ??
          cliente?.contato ??
          fornecedor?.nomeContato ??
          fornecedor?.contato ??
          "Sem contato";

        return {
          id: codigo?.id ?? Date.now() + Math.random(),
          dbId: codigo?.id ?? null,
          codigo: codigo?.codigo ?? "",
          contato: `${nomeEmpresa} • ${nomeContato}`,
        };
      })
    : [];

  const pecasAssimiladas = Array.isArray(item.itensSimilares)
    ? item.itensSimilares.map((peca) => ({
        id: peca?.id ?? null,
        codigo: peca?.codigoInterno ?? peca?.codigo ?? "",
      }))
    : [];

  return {
    formulario: {
      ano: item.ano ?? "",
      marca: item.marca ?? "",
      codigoInterno: item.codigoInterno ?? "",
      localizacao: item.localizacao ?? "",
      descricao: item.descricao ?? "",
    },
    codigosAssociados,
    pecasAssimiladas,
  };
};

function CampoBusca({ id, value, onChange, placeholder }) {
  return (
    <div className={styles.searchField}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}

function CadastrarPeca() {
  const navigate = useNavigate();
  const location = useLocation();
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [buscaContato, setBuscaContato] = useState("");
  const [contatosSugeridos, setContatosSugeridos] = useState([]);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [codigosAssociados, setCodigosAssociados] = useState([]);
  const [buscaPeca, setBuscaPeca] = useState("");
  const [pecasSugeridas, setPecasSugeridas] = useState([]);
  const [pecasAssimiladas, setPecasAssimiladas] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [itemIdEdicao, setItemIdEdicao] = useState(null);
  const [dataCadastroOriginal, setDataCadastroOriginal] = useState(null);
  const [erroCadastro, setErroCadastro] = useState("");

  useEffect(() => {
    const termo = buscaContato.trim();

    if (!termo || termo.length < 2) {
      setContatosSugeridos([]);
      return undefined;
    }

    let cancelado = false;

    const buscarContatos = async () => {
      try {
        const [respostaClientes, respostaFornecedores] = await Promise.all([
          api.get("/clientes/buscar", {
            params: { nomeContato: termo },
          }),
          api.get("/fornecedores/buscar-geral", {
            params: { nomeContato: termo },
          }),
        ]);

        const clientes = Array.isArray(respostaClientes.data)
          ? respostaClientes.data
          : Array.isArray(respostaClientes.data?.conteudo)
            ? respostaClientes.data.conteudo
            : [];

        const fornecedores = Array.isArray(respostaFornecedores.data)
          ? respostaFornecedores.data
          : [];

        if (cancelado) return;

        const contatos = [
          ...clientes.map((item) => normalizarContato(item, "cliente")),
          ...fornecedores.map((item) => normalizarContato(item, "fornecedor")),
        ]
          .filter(Boolean)
          .slice(0, 8);

        setContatosSugeridos(contatos);
      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
        if (!cancelado) {
          setContatosSugeridos([]);
        }
      }
    };

    const timer = setTimeout(buscarContatos, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [buscaContato]);

  useEffect(() => {
    const itemSelecionado = location.state?.item ?? null;
    const itemId =
      Number(itemSelecionado?.id ?? location.state?.id ?? new URLSearchParams(location.search).get("id"));

    const modoAtivo = Boolean(location.state?.modoEdicao || itemSelecionado || Number.isFinite(itemId));

    setModoEdicao(modoAtivo && Number.isFinite(itemId));
    setItemIdEdicao(Number.isFinite(itemId) ? itemId : null);

    if (!modoAtivo) {
      setFormulario(formularioInicial);
      setCodigosAssociados([]);
      setPecasAssimiladas([]);
      return undefined;
    }

    const carregarItemEdicao = async () => {
      try {
        const idParaBuscar = Number(itemSelecionado?.id ?? itemId);
        if (!Number.isFinite(idParaBuscar)) {
          return;
        }

        const resposta = await api.get(`/itens/${idParaBuscar}`);
        const item = resposta?.data ?? null;
        const dadosEdicao = normalizarItemEdicao(item);

        if (!dadosEdicao) {
          return;
        }

        setFormulario(dadosEdicao.formulario);
        setCodigosAssociados(dadosEdicao.codigosAssociados);
        setPecasAssimiladas(dadosEdicao.pecasAssimiladas);
        setDataCadastroOriginal(item?.dataCadastro ?? null);
      } catch (error) {
        console.error("Erro ao carregar peça para edição:", error);
        setErroCadastro("Não foi possível carregar os dados da peça para edição.");
      }
    };

    carregarItemEdicao();
    return undefined;
  }, [location.key, location.search, location.state]);

  useEffect(() => {
    const termo = buscaPeca.trim();

    if (!termo || termo.length < 2) {
      setPecasSugeridas([]);
      return undefined;
    }

    let cancelado = false;

    const buscarPecas = async () => {
      try {
        const resposta = await api.get("/itens/pesquisar", {
          params: { termo },
        });

        if (cancelado) return;

        const lista = Array.isArray(resposta.data) ? resposta.data : [];
        setPecasSugeridas(lista.slice(0, 8));
      } catch (error) {
        console.error("Erro ao buscar peças:", error);
        if (!cancelado) {
          setPecasSugeridas([]);
        }
      }
    };

    const timer = setTimeout(buscarPecas, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [buscaPeca]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const adicionarCodigo = async () => {
    const codigoInformado = codigo.trim();

    if (!codigoInformado) {
      return;
    }

    if (!contatoSelecionado) {
      alert("Selecione um cliente ou fornecedor antes de associar o código.");
      return;
    }

    try {
      const payload =
        contatoSelecionado.tipo === "Cliente"
          ? { codigo: codigoInformado, clienteId: contatoSelecionado.id }
          : { codigo: codigoInformado, fornecedorId: contatoSelecionado.id };

      const resposta = await api.post("/codigos-associados", payload);
      const codigoCriado = resposta.data;

      const codigoAssociadoJaExiste = codigosAssociados.some(
        (item) => item.codigo === codigoInformado,
      );

      if (!codigoAssociadoJaExiste) {
        setCodigosAssociados((itensAtuais) => [
          ...itensAtuais,
          {
            id: codigoCriado?.id || Date.now(),
            dbId: codigoCriado?.id,
            codigo: codigoCriado?.codigo || codigoInformado,
            contato: formatarContatoLabel(contatoSelecionado),
          },
        ]);
      }

      setCodigo("");
      setBuscaContato("");
      setContatosSugeridos([]);
      setContatoSelecionado(null);
    } catch (error) {
      console.error("Erro ao cadastrar código associado:", error);
      alert(
        error?.response?.data?.message ||
          "Não foi possível associar o código ao cliente ou fornecedor.",
      );
    }
  };

  const adicionarPeca = async () => {
    const termo = buscaPeca.trim();

    if (!termo) {
      return;
    }

    try {
      const resposta = await api.get("/itens/pesquisar", {
        params: { termo },
      });
      const resultados = Array.isArray(resposta.data) ? resposta.data : [];

      if (!resultados.length) {
        alert("Nenhuma peça encontrada para esse termo.");
        return;
      }

      const pecaSelecionada =
        resultados.find(
          (item) => item.codigoInterno?.toLowerCase() === termo.toLowerCase(),
        ) || resultados[0];

      if (pecasAssimiladas.some((item) => item.id === pecaSelecionada.id)) {
        alert("Essa peça já foi adicionada à lista de similares.");
        return;
      }

      setPecasAssimiladas((itensAtuais) => [
        ...itensAtuais,
        {
          id: pecaSelecionada.id,
          codigo: pecaSelecionada.codigoInterno,
        },
      ]);
      setBuscaPeca("");
      setPecasSugeridas([]);
    } catch (error) {
      console.error("Erro ao buscar peça para assimilação:", error);
      alert("Não foi possível procurar a peça informada.");
    }
  };

  const cadastrarPeca = async (event) => {
    event.preventDefault();
    setErroCadastro("");

    if (!formulario.codigoInterno.trim()) {
      setErroCadastro("Informe o código interno da peça.");
      return;
    }

    const payload = {
      codigoInterno: formulario.codigoInterno.trim(),
      marca: formulario.marca.trim() || null,
      ano: formulario.ano === "" ? null : Number(formulario.ano),
      descricao: formulario.descricao.trim() || null,
      localizacao: formulario.localizacao.trim() || null,
      dataCadastro: dataCadastroOriginal ?? new Date().toISOString(),
      codigosAssociadosIds: [...new Set(
        codigosAssociados
          .map((item) => item.dbId ?? item.id)
          .filter((id) => id != null),
      )],
      itensSimilaresIds: [...new Set(
        pecasAssimiladas
          .map((item) => item.id)
          .filter((id) => id != null),
      )],
    };

    try {
      if (modoEdicao && itemIdEdicao) {
        await api.put(`/itens/${itemIdEdicao}`, payload);
      } else {
        await api.post("/itens", payload);
      }
      navigate(-1);
    } catch (error) {
      console.error("Erro ao cadastrar peça:", error);
      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Não foi possível salvar a peça com os códigos e itens relacionados.";

      setErroCadastro(mensagem);
    }
  };

  const passos = [
    {
      label: "Informações Gerais",
      color: etapa === 1 ? "#0056cb" : "#60a5fa",
      textColor: "#ffffff",
    },
    {
      label: "Códigos Associados",
      color: etapa === 2 ? "#0056cb" : etapa > 2 ? "#60a5fa" : "#e2e8f0",
      textColor: etapa >= 2 ? "#ffffff" : "#64748b",
    },
    {
      label: "Assimilar Peças",
      color: etapa === 3 ? "#0056cb" : "#e2e8f0",
      textColor: etapa === 3 ? "#ffffff" : "#64748b",
    },
  ];

  return (
    <div className={baseStyles.page}>
      <header className={`${baseStyles.header} ${styles.header}`}>
        <Logo />
        <h1>{modoEdicao ? "Editar Peça" : "Cadastrar Peça"}</h1>
      </header>

      <main className={baseStyles.content}>
        <div
          className={`${baseStyles.progressWrapper} ${styles.progressWrapper}`}
        >
          <ProgressoCadastro
            passos={passos}
            lineColor={
              etapa === 1
                ? "#e2e8f0"
                : etapa === 2
                  ? "linear-gradient(to right, #60a5fa 0 50%, #e2e8f0 50% 100%)"
                  : "#60a5fa"
            }
          />
        </div>

        <form className={baseStyles.form} onSubmit={cadastrarPeca}>
          <section
            className={`${baseStyles.card} ${styles.card} ${
              etapa > 1 ? styles.listCard : ""
            }`}
            aria-labelledby={`titulo-etapa-${etapa}`}
          >
            {etapa === 1 && (
              <>
                <h2 id="titulo-etapa-1">Informações Gerais</h2>

                <div className={styles.generalGrid}>
                  <div className={baseStyles.column}>
                    <Input
                      id="ano-peca"
                      label="Ano:"
                      value={formulario.ano}
                      onChange={atualizarCampo("ano")}
                      placeholder="Digite o ano de fabricação da peça"
                    />
                    <Input
                      id="marca-peca"
                      label="Marca:"
                      value={formulario.marca}
                      onChange={atualizarCampo("marca")}
                      placeholder="Digite a marca da peça"
                    />
                    <div className={styles.requiredField}>
                      <Input
                        id="codigo-interno-peca"
                        label="Código Interno:"
                        value={formulario.codigoInterno}
                        onChange={atualizarCampo("codigoInterno")}
                        placeholder="Código de identificação da peça"
                      />
                    </div>
                  </div>

                  <div className={baseStyles.column}>
                    <Input
                      id="localizacao-peca"
                      label="Localização:"
                      value={formulario.localizacao}
                      onChange={atualizarCampo("localizacao")}
                      placeholder="Localização no estoque"
                    />
                    <label
                      className={baseStyles.textareaField}
                      htmlFor="descricao-peca"
                    >
                      <span>Descrição:</span>
                      <textarea
                        id="descricao-peca"
                        value={formulario.descricao}
                        onChange={atualizarCampo("descricao")}
                        placeholder="Digite a descrição da peça"
                      />
                    </label>
                  </div>
                </div>

                <div
                  className={`${baseStyles.cardActionsRight} ${styles.cardAction}`}
                >
                  <Button
                    type="button"
                    estilo="editar"
                    onClick={() => setEtapa(2)}
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {etapa === 2 && (
              <>
                <h2 id="titulo-etapa-2">Códigos Associados</h2>

                <div className={styles.associationContent}>
                  <CampoBusca
                    id="buscar-contato-codigo"
                    value={buscaContato}
                    onChange={(event) => {
                      setBuscaContato(event.target.value);
                      setContatoSelecionado(null);
                    }}
                    placeholder="Digite o nome do cliente ou fornecedor"
                  />

                  {contatosSugeridos.length > 0 && (
                    <div className={styles.contactDropdown} role="listbox" aria-label="Contatos sugeridos">
                      {contatosSugeridos.map((contato) => (
                        <button
                          key={`${contato.tipo}-${contato.id}`}
                          type="button"
                          className={styles.contactOption}
                          onClick={() => {
                            setContatoSelecionado(contato);
                            setBuscaContato(contato.label);
                            setContatosSugeridos([]);
                          }}
                        >
                          <span className={styles.contactTypeBadge}>{contato.tipo}</span>
                          <span className={styles.contactText}>
                            <strong>{contato.nomeEmpresa}</strong>
                            <small>{contato.nomeContato}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.codeRow}>
                    <label htmlFor="codigo-associado">Código</label>
                    <input
                      id="codigo-associado"
                      type="text"
                      value={codigo}
                      onChange={(event) => setCodigo(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          adicionarCodigo();
                        }
                      }}
                    />
                    <div className={styles.addButton}>
                      <Button
                        type="button"
                        estilo="editar"
                        onClick={adicionarCodigo}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className={styles.unregisteredContact}>
                    <span>Contato não cadastrado?</span>
                    <div className={styles.registerActions}>
                      <button type="button" onClick={() => navigate("/cadastrarCliente")}>
                        Cliente
                      </button>
                      <button type="button" onClick={() => navigate("/cadastrarFornecedor")}>
                        Fornecedor
                      </button>
                    </div>
                  </div>

                  <div className={styles.itemsList}>
                    {codigosAssociados.map((item) => (
                      <div className={styles.codeItem} key={item.id}>
                        <button
                          type="button"
                          aria-label={`Remover código ${item.codigo}`}
                          onClick={() =>
                            setCodigosAssociados((itensAtuais) =>
                              itensAtuais.filter(
                                (itemAtual) => itemAtual.id !== item.id,
                              ),
                            )
                          }
                        >
                          X
                        </button>
                        <span>{item.codigo}</span>
                        <span>{item.contato}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`${baseStyles.cardActionsLeft} ${styles.cardAction}`}
                >
                  <Button
                    type="button"
                    estilo="editar"
                    onClick={() => setEtapa(1)}
                  >
                    Anterior
                  </Button>
                </div>
                <div
                  className={`${baseStyles.cardActionsRight} ${styles.cardAction}`}
                >
                  <Button
                    type="button"
                    estilo="editar"
                    onClick={() => setEtapa(3)}
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {etapa === 3 && (
              <>
                <h2 id="titulo-etapa-3">Assimilar Peças</h2>

                <div className={styles.similarityContent}>
                  <label htmlFor="buscar-peca">Pesquisar por peça:</label>
                  <div className={styles.searchRow}>
                    <CampoBusca
                      id="buscar-peca"
                      value={buscaPeca}
                      onChange={(event) => setBuscaPeca(event.target.value)}
                      placeholder="Digite a peça a assimilar"
                    />
                    <div className={styles.addButton}>
                      <Button
                        type="button"
                        estilo="editar"
                        onClick={adicionarPeca}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {pecasSugeridas.length > 0 && (
                    <div
                      className={styles.suggestionDropdown}
                      role="listbox"
                      aria-label="Peças sugeridas"
                    >
                      {pecasSugeridas.map((peca) => (
                        <button
                          key={peca.id}
                          type="button"
                          className={styles.suggestionOption}
                          onClick={() => {
                            setPecasAssimiladas((itensAtuais) =>
                              itensAtuais.some((item) => item.id === peca.id)
                                ? itensAtuais
                                : [
                                    ...itensAtuais,
                                    { id: peca.id, codigo: peca.codigoInterno },
                                  ],
                            );
                            setBuscaPeca(peca.codigoInterno);
                            setPecasSugeridas([]);
                          }}
                        >
                          <span className={styles.suggestionCode}>
                            {peca.codigoInterno}
                          </span>
                          <span className={styles.suggestionMeta}>
                            {peca.marca || "Sem marca"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.itemsList}>
                    {pecasAssimiladas.map((item) => (
                      <div className={styles.partItem} key={item.id}>
                        <button
                          type="button"
                          aria-label={`Remover peça ${item.codigo}`}
                          onClick={() =>
                            setPecasAssimiladas((itensAtuais) =>
                              itensAtuais.filter(
                                (itemAtual) => itemAtual.id !== item.id,
                              ),
                            )
                          }
                        >
                          X
                        </button>
                        <span>{item.codigo}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`${baseStyles.cardActionsLeft} ${styles.cardAction}`}
                >
                  <Button
                    type="button"
                    estilo="editar"
                    onClick={() => setEtapa(2)}
                  >
                    Anterior
                  </Button>
                </div>
              </>
            )}
          </section>

          <footer
            className={`${baseStyles.footerActions} ${styles.footerActions}`}
          >
            <Button type="button" estilo="editar" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit">{modoEdicao ? "Salvar" : "Cadastrar"}</Button>
          </footer>
        </form>

        {erroCadastro && (
          <div className={styles.errorOverlay} onClick={() => setErroCadastro("")}>
            <div
              className={styles.errorPopup}
              onClick={(event) => event.stopPropagation()}
            >
              <ServerResponse
                type="error"
                title={modoEdicao ? "Falha ao atualizar a peça" : "Falha ao cadastrar a peça"}
                message={erroCadastro}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CadastrarPeca;