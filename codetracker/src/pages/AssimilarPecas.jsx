import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Logo from "../components/Logo";
import ServerResponse from "../components/ServerResponse";
import AssimilarPecasForm from "../components/AssimilarPecasForm";
import HelpButton from "../helpfeat/HelpButton";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarPeca.module.css";

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

function AssimilarPecas() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item ?? null;

  const [pendentes, setPendentes] = useState([]);
  const [idsJaSimilares, setIdsJaSimilares] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Peças que já são similares, para não oferecê-las de novo
  useEffect(() => {
    if (!item?.id) return undefined;

    let cancelado = false;

    const carregarSimilares = async () => {
      try {
        // O back responde 204 (sem corpo) quando não há similares: extrairLista devolve []
        const resposta = await api.get(`/itens/${item.id}/similares`);
        if (!cancelado) {
          setIdsJaSimilares(extrairLista(resposta.data).map((similar) => similar.id));
        }
      } catch (error) {
        console.error("Erro ao carregar peças similares:", error);
      }
    };

    carregarSimilares();

    return () => {
      cancelado = true;
    };
  }, [item?.id]);

  const adicionarPendente = (peca) =>
    setPendentes((atuais) =>
      atuais.some((pendente) => pendente.id === peca.id)
        ? atuais
        : [...atuais, { id: peca.id, codigo: peca.codigoInterno }],
    );

  const removerPendente = (id) =>
    setPendentes((atuais) => atuais.filter((pendente) => pendente.id !== id));

  const confirmar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!item?.id) {
      setErro("Peça não informada. Volte e tente novamente.");
      return;
    }

    if (pendentes.length === 0) {
      setErro("Adicione ao menos uma peça antes de confirmar.");
      return;
    }

    try {
      setSalvando(true);

      for (const pendente of pendentes) {
        await api.post(`/itens/${item.id}/similares/${pendente.id}`);

        // Se uma falha interromper o processo, o que já foi salvo não é repetido
        setPendentes((atuais) => atuais.filter((atual) => atual.id !== pendente.id));
      }

      navigate(-1);
    } catch (error) {
      console.error("Erro ao assimilar peças:", error);
      setErro(error?.response?.data?.message || "Não foi possível assimilar as peças.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={baseStyles.page}>
      <header className={`${baseStyles.header} ${styles.header}`}>
        <Logo />
        <h1>Assimilar Peças</h1>

        <div className={styles.helpAction}>
          <HelpButton />
        </div>
      </header>

      <main className={baseStyles.content}>
        <form className={baseStyles.form} onSubmit={confirmar}>
          <section
            className={`${baseStyles.card} ${styles.card} ${styles.listCard}`}
            aria-labelledby="titulo-assimilar-pecas"
          >
            <h2 id="titulo-assimilar-pecas">
              {item?.codigoInterno
                ? `Assimilar Peça de Código ${item.codigoInterno}`
                : "Peça não informada"}
            </h2>

            <AssimilarPecasForm
              itens={pendentes}
              idsExcluidos={[item?.id, ...idsJaSimilares, ...pendentes.map((p) => p.id)]}
              onAdicionar={adicionarPendente}
              onRemover={removerPendente}
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
                title="Falha ao assimilar as peças"
                message={erro}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AssimilarPecas;