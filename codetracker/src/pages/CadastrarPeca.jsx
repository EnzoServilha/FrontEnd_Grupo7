import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import ServerResponse from "../components/ServerResponse";
import AssociarCodigoForm, { montarPayloadCodigo } from "../components/AssociarCodigoForm";
import AssimilarPecasForm from "../components/AssimilarPecasForm";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarPeca.module.css";
import HelpButton from "../helpfeat/HelpButton";

const formularioInicial = {
  ano: "",
  marca: "",
  codigoInterno: "",
  localizacao: "",
  descricao: "",
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

function CadastrarPeca() {
  const navigate = useNavigate();
  const location = useLocation();
  const itemId = Number(
    location.state?.item?.id ??
    location.state?.id ??
    new URLSearchParams(location.search).get("id"),
  );
  const itemIdEdicao = Number.isInteger(itemId) && itemId > 0 ? itemId : null;
  const modoEdicao = itemIdEdicao !== null;
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [codigosAssociados, setCodigosAssociados] = useState([]);
  const [pecasAssimiladas, setPecasAssimiladas] = useState([]);
  const [dataCadastroOriginal, setDataCadastroOriginal] = useState(null);
  const [erroCadastro, setErroCadastro] = useState("");

  useEffect(() => {
    if (!modoEdicao) {
      setFormulario(formularioInicial);
      setCodigosAssociados([]);
      setPecasAssimiladas([]);
      setDataCadastroOriginal(null);
      return undefined;
    }

    let cancelado = false;

    const carregarItemEdicao = async () => {
      try {
        const resposta = await api.get(`/itens/${itemIdEdicao}`);
        const item = resposta?.data ?? null;
        const dadosEdicao = normalizarItemEdicao(item);

        if (!dadosEdicao || cancelado) return;

        setFormulario(dadosEdicao.formulario);
        setCodigosAssociados(dadosEdicao.codigosAssociados);
        setPecasAssimiladas(dadosEdicao.pecasAssimiladas);
        setDataCadastroOriginal(item?.dataCadastro ?? null);
      } catch (error) {
        console.error("Erro ao carregar peça para edição:", error);
        if (!cancelado) {
          setErroCadastro("Não foi possível carregar os dados da peça para edição.");
        }
      }
    };

    carregarItemEdicao();
    return () => {
      cancelado = true;
    };
  }, [location.key, itemIdEdicao, modoEdicao]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  // Cria o código no back já na hora; o vínculo com a peça vai no salvar.
  // Devolve um texto de erro (mostrado no formulário) ou nada em caso de sucesso.
  const adicionarCodigo = async ({ codigo, contato }) => {
    if (codigosAssociados.some((item) => item.codigo === codigo)) {
      return "Esse código já foi adicionado.";
    }

    const resposta = await api.post("/codigos-associados", montarPayloadCodigo(codigo, contato));
    const codigoCriado = resposta.data;

    setCodigosAssociados((itensAtuais) => [
      ...itensAtuais,
      {
        id: codigoCriado?.id || Date.now(),
        dbId: codigoCriado?.id,
        codigo: codigoCriado?.codigo || codigo,
        contato: contato.label,
      },
    ]);

    return undefined;
  };

  const removerCodigo = (id) =>
    setCodigosAssociados((itensAtuais) => itensAtuais.filter((item) => item.id !== id));

  const adicionarPeca = (peca) =>
    setPecasAssimiladas((itensAtuais) =>
      itensAtuais.some((item) => item.id === peca.id)
        ? itensAtuais
        : [...itensAtuais, { id: peca.id, codigo: peca.codigoInterno }],
    );

  const removerPeca = (id) =>
    setPecasAssimiladas((itensAtuais) => itensAtuais.filter((item) => item.id !== id));

  const cadastrarContato = (tipo) =>
    navigate(tipo === "cliente" ? "/cadastrarCliente" : "/cadastrarFornecedor");

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

        <div className={styles.helpAction}>
          <HelpButton />
        </div>
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
            className={`${baseStyles.card} ${styles.card} ${etapa > 1 ? styles.listCard : ""
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

                <AssociarCodigoForm
                  itens={codigosAssociados}
                  onAdicionar={adicionarCodigo}
                  onRemover={removerCodigo}
                  onCadastrarContato={cadastrarContato}
                />

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

                <AssimilarPecasForm
                  itens={pecasAssimiladas}
                  idsExcluidos={[itemIdEdicao, ...pecasAssimiladas.map((peca) => peca.id)]}
                  onAdicionar={adicionarPeca}
                  onRemover={removerPeca}
                />

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