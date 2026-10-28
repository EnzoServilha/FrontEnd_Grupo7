import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarFornecedor.module.css";
import HelpButton from "../helpfeat/HelpButton";

const formularioInicial = {
  nome: "",
  nomeContato: "",
  cnpj: "",
  razaoSocial: "",
  telefone: "",
  email: "",
  observacoes: "",
  categorias: [],
  marcas: [],
  cep: "",
  uf: "",
  cidade: "",
  bairro: "",
  logradouro: "",
  numero: "",
  complemento: "",
};

const normalizarTexto = (valor = "") => String(valor).trim().toLowerCase();

const mapearNomesParaIds = (nomes, opcoes) => {
  const mapa = new Map(
    (opcoes || []).map((opcao) => [normalizarTexto(opcao.nome), opcao.id]),
  );

  return (nomes || [])
    .map((nome) => mapa.get(normalizarTexto(nome)))
    .filter((id) => id !== undefined && id !== null);
};

function CampoTags({
  id,
  label,
  placeholder,
  valores,
  opcoesDisponiveis,
  onAdicionar,
  onRemover,
  mensagemNaoEncontrada,
}) {
  const [novoValor, setNovoValor] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const valorBusca = novoValor.trim().toLowerCase();
  const sugestoes = valorBusca
    ? (opcoesDisponiveis || [])
        .filter((opcao) => {
          const nome = String(opcao.nome ?? "").trim().toLowerCase();
          return (
            nome.includes(valorBusca) &&
            !valores.some(
              (valorExistente) =>
                String(valorExistente).trim().toLowerCase() === nome,
            )
          );
        })
        .slice(0, 6)
    : [];

  const adicionar = (valorInformado = novoValor) => {
    const valor = String(valorInformado || "").trim();
    if (!valor) return;
    onAdicionar(valor);
    setNovoValor("");
    setMostrarSugestoes(false);
  };

  return (
    <div className={styles.tagField}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.tagInput} style={{ position: "relative" }}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          id={id}
          type="text"
          value={novoValor}
          placeholder={placeholder}
          onChange={(event) => {
            setNovoValor(event.target.value);
            setMostrarSugestoes(true);
          }}
          onFocus={() => setMostrarSugestoes(true)}
          onBlur={() => {
            setTimeout(() => setMostrarSugestoes(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              adicionar();
            }
          }}
        />

        {mostrarSugestoes && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
              zIndex: 20,
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {sugestoes.length > 0 ? (
              sugestoes.map((opcao, index) => (
                <button
                  key={`${opcao.id ?? opcao.nome}-${index}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    adicionar(opcao.nome);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "10px 12px",
                    cursor: "pointer",
                    color: "#0f172a",
                  }}
                >
                  {opcao.nome}
                </button>
              ))
            ) : valorBusca ? (
              <div
                style={{
                  padding: "10px 12px",
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                }}
              >
                {mensagemNaoEncontrada}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className={styles.tagList} aria-label={`${label} adicionadas`}>
        {valores.map((valor, index) => (
          <button
            type="button"
            className={styles.tagChip}
            key={`${valor}-${index}`}
            aria-label={`Remover ${valor}`}
            onClick={() => onRemover(index)}
          >
            {valor}
          </button>
        ))}
      </div>
    </div>
  );
}

function CadastrarFornecedor() {
  const navigate = useNavigate();
  const location = useLocation();
  const fornecedorId = location.state?.fornecedorId ?? null;
  const modoEdicao = Boolean(fornecedorId);
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [marcasDisponiveis, setMarcasDisponiveis] = useState([]);
  const [fornecedorAtual, setFornecedorAtual] = useState(null);

  useEffect(() => {
    const buscarOpcoes = async () => {
      try {
        const [respostaCategorias, respostaMarcas] = await Promise.all([
          api.get("/categorias/administracao?ativo=todos"),
          api.get("/marcas/administracao?ativo=todos"),
        ]);

        setCategoriasDisponiveis(respostaCategorias.data || []);
        setMarcasDisponiveis(respostaMarcas.data || []);
      } catch (error) {
        console.error("Erro ao carregar categorias e marcas:", error);
      }
    };

    const carregarFornecedorParaEdicao = async () => {
      if (!modoEdicao) return;

      try {
        const resposta = await api.get(`/fornecedores/${fornecedorId}`);
        const dadosFornecedor = resposta.data || {};

        setFornecedorAtual(dadosFornecedor);
        setFormulario({
          ...formularioInicial,
          nome: dadosFornecedor.nomeEmpresa || "",
          nomeContato: dadosFornecedor.nomeContato || "",
          cnpj: dadosFornecedor.cnpj || "",
          razaoSocial: dadosFornecedor.razaoSocial || "",
          telefone: dadosFornecedor.telefone || "",
          email: dadosFornecedor.email || "",
          observacoes: dadosFornecedor.observacoes || "",
          categorias: Array.isArray(dadosFornecedor.categoria)
            ? dadosFornecedor.categoria.map((item) => item?.nome || "").filter(Boolean)
            : [],
          marcas: Array.isArray(dadosFornecedor.marcas)
            ? dadosFornecedor.marcas.map((item) => item?.nome || "").filter(Boolean)
            : [],
          cep: dadosFornecedor.endereco?.cep || "",
          uf: dadosFornecedor.endereco?.uf || "",
          cidade: dadosFornecedor.endereco?.cidade || "",
          bairro: dadosFornecedor.endereco?.bairro || "",
          logradouro: dadosFornecedor.endereco?.logradouro || "",
          numero: dadosFornecedor.endereco?.numero || "",
          complemento: dadosFornecedor.endereco?.complemento || "",
        });
      } catch (error) {
        console.error("Erro ao carregar fornecedor para edição:", error);
        alert(
          error?.response?.data?.message ||
            "Não foi possível carregar os dados do fornecedor para edição.",
        );
        voltarParaFornecedores();
      }
    };

    buscarOpcoes();
    carregarFornecedorParaEdicao();
  }, [fornecedorId, modoEdicao]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const adicionarTag = (campo, valor) => {
    const texto = String(valor || "").trim();
    if (!texto) return;

    setFormulario((dadosAtuais) => {
      const listaAtual = dadosAtuais[campo] || [];
      const jaExiste = listaAtual.some(
        (item) => normalizarTexto(item) === normalizarTexto(texto),
      );

      if (jaExiste) {
        return dadosAtuais;
      }

      return {
        ...dadosAtuais,
        [campo]: [...listaAtual, texto],
      };
    });
  };

  const removerTag = (campo, index) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: dadosAtuais[campo].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const voltarParaFornecedores = () => {
    navigate("/contatos", {
      state: {
        tipoAtivo: "fornecedores",
      },
    });
  };

  const cadastrarFornecedor = async (event) => {
    event.preventDefault();

    if (!formulario.nome?.trim()) {
      alert("O campo Nome é obrigatório.");
      return;
    }

    if (!formulario.cnpj?.trim()) {
      alert("O campo CNPJ é obrigatório.");
      return;
    }

    try {
      const dadosEndereco = {
        cep: formulario.cep?.trim(),
        uf: formulario.uf?.trim(),
        cidade: formulario.cidade?.trim(),
        bairro: formulario.bairro?.trim(),
        logradouro: formulario.logradouro?.trim(),
        numero: formulario.numero?.trim(),
        complemento: formulario.complemento?.trim(),
      };

      const temDadosEndereco = Object.values(dadosEndereco).some((valor) =>
        Boolean(valor),
      );

      let enderecoId = modoEdicao && fornecedorAtual?.endereco?.id
        ? fornecedorAtual.endereco.id
        : null;

      if (temDadosEndereco) {
        if (modoEdicao && fornecedorAtual?.endereco?.id) {
          await api.put(`/enderecos/${fornecedorAtual.endereco.id}`, dadosEndereco);
        } else {
          const responseEndereco = await api.post("/enderecos", dadosEndereco);
          enderecoId = responseEndereco.data?.id ?? null;
        }
      }

      const categoriaIds = mapearNomesParaIds(
        formulario.categorias,
        categoriasDisponiveis,
      );
      const marcaIds = mapearNomesParaIds(formulario.marcas, marcasDisponiveis);

      if (formulario.categorias.length > 0 && categoriaIds.length !== formulario.categorias.length) {
        alert("Uma ou mais categorias informadas não foram encontradas no sistema.");
        return;
      }

      if (formulario.marcas.length > 0 && marcaIds.length !== formulario.marcas.length) {
        alert("Uma ou mais marcas informadas não foram encontradas no sistema.");
        return;
      }

      const payloadFornecedor = {
        razaoSocial: formulario.razaoSocial || null,
        cnpj: formulario.cnpj || null,
        nomeContato: formulario.nomeContato || null,
        nomeEmpresa: formulario.nome || null,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        observacoes: formulario.observacoes || null,
        categoriaId: categoriaIds,
        marcaId: marcaIds,
        enderecoId,
      };

      if (modoEdicao) {
        await api.put(`/fornecedores/${fornecedorId}`, payloadFornecedor);
      } else {
        await api.post("/fornecedores", payloadFornecedor);
      }

      voltarParaFornecedores();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      alert(
        error?.response?.data?.message ||
          `Não foi possível ${modoEdicao ? "atualizar" : "cadastrar"} o fornecedor. Verifique os dados e tente novamente.`,
      );
    }
  };

  const passos = [
    {
      label: "Informações Gerais",
      color: etapa === 1 ? "#0056cb" : "#60a5fa",
      textColor: "#ffffff",
    },
    {
      label: "Endereço",
      color: etapa === 2 ? "#0056cb" : "#e2e8f0",
      textColor: etapa === 2 ? "#ffffff" : "#64748b",
    },
  ];

  return (
    <div className={baseStyles.page}>
      <header className={`${baseStyles.header} ${styles.header}`}>
        <Logo />
        <h1>{modoEdicao ? "Editar Fornecedor" : "Cadastrar Fornecedor"}</h1>
        <h1>Cadastrar Fornecedor</h1>

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
            lineColor={etapa === 2 ? "#60a5fa" : "#e2e8f0"}
          />
        </div>

        <form className={baseStyles.form} onSubmit={cadastrarFornecedor}>
          <section
            className={`${baseStyles.card} ${styles.card} ${
              etapa === 2 ? `${baseStyles.addressCard} ${styles.addressCard}` : ""
            }`}
            aria-labelledby={
              etapa === 1
                ? "titulo-informacoes-fornecedor"
                : "titulo-endereco-fornecedor"
            }
          >
            {etapa === 1 ? (
              <>
                <h2 id="titulo-informacoes-fornecedor">Informações Gerais</h2>

                <div className={styles.generalGrid}>
                  <div className={baseStyles.column}>
                    <div className={styles.requiredField}>
                      <Input
                        id="nome-fornecedor"
                        label="Nome:"
                        value={formulario.nome}
                        onChange={atualizarCampo("nome")}
                        placeholder="Digite o nome do fornecedor"
                      />
                    </div>
                    <Input
                      id="contato-fornecedor"
                      label="Nome do Contato:"
                      value={formulario.nomeContato}
                      onChange={atualizarCampo("nomeContato")}
                      placeholder="Digite o contato do fornecedor"
                    />
                    <div className={styles.requiredField}>
                      <Input
                        id="cnpj-fornecedor"
                        label="Cnpj:"
                        value={formulario.cnpj}
                        onChange={atualizarCampo("cnpj")}
                        placeholder="Digite o Cnpj do fornecedor"
                      />
                    </div>
                    <label
                      className={baseStyles.textareaField}
                      htmlFor="razao-social-fornecedor"
                    >
                      <span>Razão Social:</span>
                      <textarea
                        id="razao-social-fornecedor"
                        value={formulario.razaoSocial}
                        onChange={atualizarCampo("razaoSocial")}
                        placeholder="Digite a razão social do fornecedor"
                      />
                    </label>
                  </div>

                  <div className={`${baseStyles.column} ${styles.middleColumn}`}>
                    <Input
                      id="telefone-fornecedor"
                      label="Telefone:"
                      value={formulario.telefone}
                      onChange={atualizarCampo("telefone")}
                      placeholder="Digite o telefone do Fornecedor"
                    />
                    <Input
                      id="email-fornecedor"
                      label="Email:"
                      type="email"
                      value={formulario.email}
                      onChange={atualizarCampo("email")}
                      placeholder="Digite o email do fornecedor"
                    />
                    <label
                      className={baseStyles.textareaField}
                      htmlFor="observacoes-fornecedor"
                    >
                      <span>Observações:</span>
                      <textarea
                        id="observacoes-fornecedor"
                        value={formulario.observacoes}
                        onChange={atualizarCampo("observacoes")}
                        placeholder="Digite observações sobre o fornecedor"
                      />
                    </label>
                  </div>

                  <div className={styles.tagsColumn}>
                    <CampoTags
                      id="categorias-fornecedor"
                      label="Categorias:"
                      placeholder="Adicione categorias para o fornecedor"
                      valores={formulario.categorias}
                      opcoesDisponiveis={categoriasDisponiveis}
                      onAdicionar={(valor) => adicionarTag("categorias", valor)}
                      onRemover={(index) => removerTag("categorias", index)}
                      mensagemNaoEncontrada="Categoria não encontrada no sistema."
                    />
                    <CampoTags
                      id="marcas-fornecedor"
                      label="Marcas:"
                      placeholder="Adicione marcas para o fornecedor"
                      valores={formulario.marcas}
                      opcoesDisponiveis={marcasDisponiveis}
                      onAdicionar={(valor) => adicionarTag("marcas", valor)}
                      onRemover={(index) => removerTag("marcas", index)}
                      mensagemNaoEncontrada="Marca não encontrada no sistema."
                    />
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
            ) : (
              <>
                <h2 id="titulo-endereco-fornecedor">Endereço</h2>

                <div
                  className={`${baseStyles.addressGrid} ${styles.addressGrid}`}
                >
                  <div className={baseStyles.column}>
                    <Input
                      id="cep-fornecedor"
                      label="CEP:"
                      value={formulario.cep}
                      onChange={atualizarCampo("cep")}
                      placeholder="Digite o CEP do fornecedor"
                    />
                    <Input
                      id="uf-fornecedor"
                      label="UF:"
                      value={formulario.uf}
                      onChange={atualizarCampo("uf")}
                      placeholder="Digite a UF do fornecedor"
                    />
                    <Input
                      id="cidade-fornecedor"
                      label="Cidade:"
                      value={formulario.cidade}
                      onChange={atualizarCampo("cidade")}
                      placeholder="Digite a cidade do fornecedor"
                    />
                    <Input
                      id="bairro-fornecedor"
                      label="Bairro:"
                      value={formulario.bairro}
                      onChange={atualizarCampo("bairro")}
                      placeholder="Digite o bairro do fornecedor"
                    />
                  </div>

                  <div
                    className={`${baseStyles.column} ${baseStyles.addressRightColumn}`}
                  >
                    <Input
                      id="logradouro-fornecedor"
                      label="Logradouro:"
                      value={formulario.logradouro}
                      onChange={atualizarCampo("logradouro")}
                      placeholder="Digite o logradouro do fornecedor"
                    />
                    <Input
                      id="numero-fornecedor"
                      label="Número:"
                      value={formulario.numero}
                      onChange={atualizarCampo("numero")}
                      placeholder="Digite o número do fornecedor"
                    />
                    <Input
                      id="complemento-fornecedor"
                      label="Complemento:"
                      value={formulario.complemento}
                      onChange={atualizarCampo("complemento")}
                      placeholder="Digite o complemento do fornecedor"
                    />
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
              </>
            )}
          </section>

          <footer
            className={`${baseStyles.footerActions} ${styles.footerActions}`}
          >
            <Button
              type="button"
              estilo="editar"
              onClick={() => voltarParaFornecedores()}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {modoEdicao ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default CadastrarFornecedor;