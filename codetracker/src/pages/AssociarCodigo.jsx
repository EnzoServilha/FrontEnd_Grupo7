import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Logo from "../components/Logo";
import ServerResponse from "../components/ServerResponse";
import AssociarCodigoForm, { montarPayloadCodigo } from "../components/AssociarCodigoForm";
import HelpButton from "../helpfeat/HelpButton";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarPeca.module.css";

function AssociarCodigo() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item ?? null;
  const codigoEdicao = location.state?.codigo ?? null;
  const modoEdicao = Boolean(codigoEdicao);

  const codigoInicial =
    codigoEdicao && codigoEdicao.codigo !== "---" ? codigoEdicao.codigo : "";

  const contatoInicial = codigoEdicao?.contatoId
    ? {
      id: codigoEdicao.contatoId,
      tipo: codigoEdicao.tipoContato === "cliente" ? "Cliente" : "Fornecedor",
      nomeEmpresa: codigoEdicao.contato,
      nomeContato: "",
      label: codigoEdicao.contato !== "---" ? codigoEdicao.contato : "",
    }
    : null;

  const [pendentes, setPendentes] = useState([]);
  const [estadoEdicao, setEstadoEdicao] = useState({
    codigo: codigoInicial,
    contato: contatoInicial,
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const adicionarPendente = ({ codigo, contato }) => {
    setPendentes((atuais) => [
      ...atuais,
      { id: Date.now(), codigo, contato: contato.label, contatoObj: contato },
    ]);
  };

  const removerPendente = (id) =>
    setPendentes((atuais) => atuais.filter((pendente) => pendente.id !== id));

  const cadastrarContato = (tipo) =>
    navigate(tipo === "cliente" ? "/cadastrarCliente" : "/cadastrarFornecedor");

  const confirmar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!item?.id) {
      setErro("Peça não informada. Volte e tente novamente.");
      return;
    }

    try {
      setSalvando(true);

      if (modoEdicao) {
        const codigo = estadoEdicao.codigo.trim();

        if (!codigo || !estadoEdicao.contato) {
          setErro("Informe o código e selecione o cliente ou fornecedor.");
          return;
        }

        await api.put(
          `/codigos-associados/${codigoEdicao.id}`,
          montarPayloadCodigo(codigo, estadoEdicao.contato),
        );
      } else {
        if (pendentes.length === 0) {
          setErro("Adicione ao menos um código antes de confirmar.");
          return;
        }

        for (const pendente of pendentes) {
          const criado = await api.post(
            "/codigos-associados",
            montarPayloadCodigo(pendente.codigo, pendente.contatoObj),
          );
          await api.post(`/itens/${item.id}/codigos-associados/${criado.data.id}`);

          // Se uma falha interromper o processo, o que já foi salvo não é repetido
          setPendentes((atuais) => atuais.filter((atual) => atual.id !== pendente.id));
        }
      }

      navigate(-1);
    } catch (error) {
      console.error("Erro ao salvar código associado:", error);
      setErro(
        error?.response?.data?.message || "Não foi possível salvar o código associado.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={baseStyles.page}>
      <header className={`${baseStyles.header} ${styles.header}`}>
        <Logo />
        <h1>{modoEdicao ? "Editar Código Associado" : "Associar Código"}</h1>

        <div className={styles.helpAction}>
          <HelpButton />
        </div>
      </header>

      <main className={baseStyles.content}>
        <form className={baseStyles.form} onSubmit={confirmar}>
          <section
            className={`${baseStyles.card} ${styles.card} ${styles.listCard}`}
            aria-labelledby="titulo-associar-codigo"
          >
            <h2 id="titulo-associar-codigo">
              {item?.codigoInterno ? `Peça ${item.codigoInterno}` : "Peça não informada"}
            </h2>

            <AssociarCodigoForm
              itens={pendentes}
              modoEdicao={modoEdicao}
              contatoInicial={contatoInicial}
              codigoInicial={codigoInicial}
              onAdicionar={adicionarPendente}
              onRemover={removerPendente}
              onCadastrarContato={cadastrarContato}
              onEstadoChange={setEstadoEdicao}
            />
          </section>

          <footer className={`${baseStyles.footerActions} ${styles.footerActions}`}>
            <Button type="button" estilo="editar" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar"}
            </Button>
          </footer>
        </form>

        {erro && (
          <div className={styles.errorOverlay} onClick={() => setErro("")}>
            <div className={styles.errorPopup} onClick={(event) => event.stopPropagation()}>
              <ServerResponse
                type="error"
                title="Falha ao salvar o código associado"
                message={erro}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AssociarCodigo;