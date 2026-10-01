import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarPeca.module.css";

const formularioInicial = {
  ano: "",
  marca: "",
  codigoInterno: "",
  localizacao: "",
  descricao: "",
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
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [tipoContato, setTipoContato] = useState("cliente");
  const [buscaContato, setBuscaContato] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigosAssociados, setCodigosAssociados] = useState([
    { id: 1, codigo: "Código", contato: "Cliente/Fornecedor" },
  ]);
  const [buscaPeca, setBuscaPeca] = useState("");
  const [pecasAssimiladas, setPecasAssimiladas] = useState([
    { id: 1, codigo: "Código Interno" },
  ]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const adicionarCodigo = () => {
    const codigoInformado = codigo.trim();
    if (!codigoInformado) return;

    setCodigosAssociados((itensAtuais) => [
      ...itensAtuais,
      {
        id: Date.now(),
        codigo: codigoInformado,
        contato: buscaContato.trim() ||
          (tipoContato === "cliente" ? "Cliente" : "Fornecedor"),
      },
    ]);
    setCodigo("");
  };

  const adicionarPeca = () => {
    const pecaInformada = buscaPeca.trim();
    if (!pecaInformada) return;

    setPecasAssimiladas((itensAtuais) => [
      ...itensAtuais,
      { id: Date.now(), codigo: pecaInformada },
    ]);
    setBuscaPeca("");
  };

  const cadastrarPeca = async (event) => {
    event.preventDefault();

    const payload = {
      codigoInterno: formulario.codigoInterno.trim(),
      marca: formulario.marca.trim() || null,
      ano: formulario.ano === "" ? null : Number(formulario.ano),
      descricao: formulario.descricao.trim() || null,
      localizacao: formulario.localizacao.trim() || null,
      dataCadastro: new Date().toISOString(),
      codigosAssociadosIds: [],
      itensSimilaresIds: [],
    };

    if (!payload.codigoInterno) {
      return;
    }

    try {
      await api.post("/itens", payload);
      navigate(-1);
    } catch (error) {
      console.error("Erro ao cadastrar peça:", error);
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
        <h1>Cadastrar Peça</h1>
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
                  <fieldset className={styles.contactType}>
                    <legend>Tipo de contato</legend>
                    <label>
                      <input
                        type="radio"
                        name="tipo-contato-peca"
                        value="cliente"
                        checked={tipoContato === "cliente"}
                        onChange={(event) => setTipoContato(event.target.value)}
                      />
                      Cliente
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="tipo-contato-peca"
                        value="fornecedor"
                        checked={tipoContato === "fornecedor"}
                        onChange={(event) => setTipoContato(event.target.value)}
                      />
                      Fornecedor
                    </label>
                  </fieldset>

                  <CampoBusca
                    id="buscar-contato-codigo"
                    value={buscaContato}
                    onChange={(event) => setBuscaContato(event.target.value)}
                    placeholder="Digite o código que deseja associar ou o cliente/fornecedor do código"
                  />

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
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          tipoContato === "cliente"
                            ? "/cadastrarCliente"
                            : "/cadastrarFornecedor",
                        )
                      }
                    >
                      Cadastrar
                    </button>
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
                      placeholder="Digite a Peça a assimilar"
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
            <Button type="submit">
              Cadastrar
            </Button>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default CadastrarPeca;