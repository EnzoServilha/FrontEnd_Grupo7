import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import baseStyles from "./CadastrarCliente.module.css";
import styles from "./CadastrarFornecedor.module.css";

const formularioInicial = {
  nome: "",
  nomeContato: "",
  cnpj: "",
  razaoSocial: "",
  telefone: "",
  email: "",
  observacoes: "",
  categorias: ["X", "X", "X", "X", "X"],
  marcas: ["X", "X", "X", "X", "X"],
  cep: "",
  uf: "",
  cidade: "",
  bairro: "",
  logradouro: "",
  numero: "",
  complemento: "",
};

function CampoTags({ id, label, placeholder, valores, onAdicionar, onRemover }) {
  const [novoValor, setNovoValor] = useState("");

  const adicionar = () => {
    const valor = novoValor.trim();
    if (!valor) return;
    onAdicionar(valor);
    setNovoValor("");
  };

  return (
    <div className={styles.tagField}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.tagInput}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          id={id}
          type="text"
          value={novoValor}
          placeholder={placeholder}
          onChange={(event) => setNovoValor(event.target.value)}
          onBlur={adicionar}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              adicionar();
            }
          }}
        />
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
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const adicionarTag = (campo, valor) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: [...dadosAtuais[campo], valor],
    }));
  };

  const removerTag = (campo, index) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: dadosAtuais[campo].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const voltarParaFornecedores = (novoFornecedor) => {
    navigate("/contatos", {
      state: {
        tipoAtivo: "fornecedores",
        novoFornecedor,
      },
    });
  };

  const cadastrarFornecedor = (event) => {
    event.preventDefault();

    voltarParaFornecedores({
      id: Date.now(),
      empresa: formulario.nome || "Novo Fornecedor",
      contato: formulario.nomeContato || "Não informado",
      telefone: formulario.telefone || "Não informado",
      email: formulario.email || "Não informado",
      localizacao:
        formulario.uf || formulario.cidade
          ? `${formulario.uf || "--"} - ${formulario.cidade || "Não informada"}`
          : "Não informada",
      categorias: formulario.categorias,
      fabricantes: formulario.marcas,
    });
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
        <h1>Cadastrar Fornecedor</h1>
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
                    <Input
                      id="cnpj-fornecedor"
                      label="Cnpj:"
                      value={formulario.cnpj}
                      onChange={atualizarCampo("cnpj")}
                      placeholder="Digite o Cnpj do fornecedor"
                    />
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
                      onAdicionar={(valor) => adicionarTag("categorias", valor)}
                      onRemover={(index) => removerTag("categorias", index)}
                    />
                    <CampoTags
                      id="marcas-fornecedor"
                      label="Marcas:"
                      placeholder="Adicione marcas para o fornecedor"
                      valores={formulario.marcas}
                      onAdicionar={(valor) => adicionarTag("marcas", valor)}
                      onRemover={(index) => removerTag("marcas", index)}
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
            <Button type="submit" disabled={etapa !== 2}>
              Cadastrar
            </Button>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default CadastrarFornecedor;