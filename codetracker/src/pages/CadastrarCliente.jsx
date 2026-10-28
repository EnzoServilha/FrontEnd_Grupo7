import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../provider/api";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import ProgressoCadastro from "../components/ProgressoCadastro";
import styles from "./CadastrarCliente.module.css";
import HelpButton from "../helpfeat/HelpButton";

const formularioInicial = {
  tipo: "empresa",
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  observacoes: "",
  nomeContato: "",
  cep: "",
  uf: "",
  cidade: "",
  bairro: "",
  logradouro: "",
  numero: "",
  complemento: "",
};

function CadastrarCliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const clienteId = location.state?.clienteId ?? null;
  const modoEdicao = Boolean(clienteId);
  const [etapa, setEtapa] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [clienteAtual, setClienteAtual] = useState(null);

  useEffect(() => {
    const carregarClienteParaEdicao = async () => {
      if (!modoEdicao) return;

      try {
        const resposta = await api.get("/clientes?pagina=0&tamanho=1000");
        const itens = resposta.data?.conteudo || [];
        const clienteEncontrado = itens.find(
          (item) => Number(item.id) === Number(clienteId),
        );

        const dadosCliente = clienteEncontrado || resposta.data || {};

        setClienteAtual(dadosCliente);
        setFormulario({
          ...formularioInicial,
          tipo: "empresa",
          nome: dadosCliente.nomeEmpresa || "",
          cnpj: dadosCliente.cpfCnpj || "",
          telefone: dadosCliente.telefone || "",
          email: dadosCliente.email || "",
          observacoes: dadosCliente.observacoes || "",
          nomeContato: dadosCliente.nomeContato || "",
          cep: dadosCliente.endereco?.cep || "",
          uf: dadosCliente.endereco?.uf || "",
          cidade: dadosCliente.endereco?.cidade || "",
          bairro: dadosCliente.endereco?.bairro || "",
          logradouro: dadosCliente.endereco?.logradouro || "",
          numero: dadosCliente.endereco?.numero || "",
          complemento: dadosCliente.endereco?.complemento || "",
        });
      } catch (error) {
        console.error("Erro ao carregar cliente para edição:", error);
        alert(
          error?.response?.data?.message ||
            "Não foi possível carregar os dados do cliente para edição.",
        );
        voltarParaClientes();
      }
    };

    carregarClienteParaEdicao();
  }, [clienteId, modoEdicao]);

  const atualizarCampo = (campo) => (event) => {
    setFormulario((dadosAtuais) => ({
      ...dadosAtuais,
      [campo]: event.target.value,
    }));
  };

  const voltarParaClientes = (novoCliente) => {
    navigate("/contatos", {
      state: {
        tipoAtivo: "clientes",
        novoCliente,
      },
    });
  };

  const cadastrarCliente = async (event) => {
    event.preventDefault();

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

      const temDadosEndereco = Object.values(dadosEndereco).some(
        (valor) => Boolean(valor),
      );

      let enderecoId = modoEdicao && clienteAtual?.endereco?.id
        ? clienteAtual.endereco.id
        : null;

      if (temDadosEndereco) {
        if (modoEdicao && clienteAtual?.endereco?.id) {
          await api.put(`/enderecos/${clienteAtual.endereco.id}`, dadosEndereco);
        } else {
          const responseEndereco = await api.post("/enderecos", dadosEndereco);
          enderecoId = responseEndereco.data?.id ?? null;
        }
      }

      const payloadCliente = {
        nomeEmpresa: formulario.nome || "Cliente sem nome",
        nomeContato: formulario.nomeContato || null,
        cpfCnpj: formulario.cnpj || null,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        observacoes: formulario.observacoes || null,
        enderecoId,
      };

      if (modoEdicao) {
        await api.put(`/clientes/${clienteId}`, payloadCliente);
      } else {
        await api.post("/clientes", payloadCliente);
      }

      voltarParaClientes({
        id: Date.now(),
        empresa: formulario.nome || "Novo Cliente",
        contato: formulario.nomeContato || "Não informado",
        localizacao:
          formulario.uf || formulario.cidade
            ? `${formulario.uf || "--"} - ${formulario.cidade || "Não informada"}`
            : "Não informada",
        telefone: formulario.telefone || "Não informado",
        email: formulario.email || "Não informado",
      });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert(
        error?.response?.data?.message ||
          `Não foi possível ${modoEdicao ? "atualizar" : "cadastrar"} o cliente. Verifique os dados e tente novamente.`,
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
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <h1>{modoEdicao ? "Editar Cliente" : "Cadastrar Cliente"}</h1>
        <h1>Cadastrar Cliente</h1>

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

        <form className={styles.form} onSubmit={cadastrarCliente}>
          <section
            className={`${styles.card} ${
              etapa === 2 ? styles.addressCard : ""
            }`}
            aria-labelledby={etapa === 1 ? "titulo-informacoes" : "titulo-endereco"}
          >
            {etapa === 1 ? (
              <>
                <h2 id="titulo-informacoes">Informações Gerais</h2>

                <div className={styles.generalGrid}>
                  <div className={styles.column}>
                    <fieldset className={styles.customerType}>
                      <legend>Tipo de cliente</legend>
                      <label>
                        <input
                          type="radio"
                          name="tipo-cliente"
                          value="empresa"
                          checked={formulario.tipo === "empresa"}
                          onChange={atualizarCampo("tipo")}
                        />
                        Empresa
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="tipo-cliente"
                          value="pessoa"
                          checked={formulario.tipo === "pessoa"}
                          onChange={atualizarCampo("tipo")}
                        />
                        Pessoa
                      </label>
                    </fieldset>

                    <Input
                      id="nome-cliente"
                      label="Nome:"
                      value={formulario.nome}
                      onChange={atualizarCampo("nome")}
                      placeholder="Digite o nome do cliente"
                    />
                    <Input
                      id="cnpj-cliente"
                      label="Cnpj:"
                      value={formulario.cnpj}
                      onChange={atualizarCampo("cnpj")}
                      placeholder="Digite o Cnpj do cliente"
                    />
                    <Input
                      id="telefone-cliente"
                      label="Telefone:"
                      value={formulario.telefone}
                      onChange={atualizarCampo("telefone")}
                      placeholder="Digite o telefone do cliente"
                    />
                  </div>

                  <div className={`${styles.column} ${styles.rightColumn}`}>
                    <Input
                      id="email-cliente"
                      label="Email:"
                      type="email"
                      value={formulario.email}
                      onChange={atualizarCampo("email")}
                      placeholder="Digite o email do cliente"
                    />

                    <label className={styles.textareaField} htmlFor="observacoes-cliente">
                      <span>Observações:</span>
                      <textarea
                        id="observacoes-cliente"
                        value={formulario.observacoes}
                        onChange={atualizarCampo("observacoes")}
                        placeholder="Digite observações sobre o cliente"
                      />
                    </label>

                    <Input
                      id="contato-cliente"
                      label="Nome do Contato:"
                      value={formulario.nomeContato}
                      onChange={atualizarCampo("nomeContato")}
                      placeholder="Digite o nome do contato do cliente"
                    />
                  </div>
                </div>

                <div className={styles.cardActionsRight}>
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
                <h2 id="titulo-endereco">Endereço</h2>

                <div className={styles.addressGrid}>
                  <div className={styles.column}>
                    <Input
                      id="cep-cliente"
                      label="CEP:"
                      value={formulario.cep}
                      onChange={atualizarCampo("cep")}
                      placeholder="Digite o CEP do cliente"
                    />
                    <Input
                      id="uf-cliente"
                      label="UF:"
                      value={formulario.uf}
                      onChange={atualizarCampo("uf")}
                      placeholder="Digite a UF do cliente"
                    />
                    <Input
                      id="cidade-cliente"
                      label="Cidade:"
                      value={formulario.cidade}
                      onChange={atualizarCampo("cidade")}
                      placeholder="Digite a cidade do cliente"
                    />
                    <Input
                      id="bairro-cliente"
                      label="Bairro:"
                      value={formulario.bairro}
                      onChange={atualizarCampo("bairro")}
                      placeholder="Digite o bairro do cliente"
                    />
                  </div>

                  <div className={`${styles.column} ${styles.addressRightColumn}`}>
                    <Input
                      id="logradouro-cliente"
                      label="Logradouro:"
                      value={formulario.logradouro}
                      onChange={atualizarCampo("logradouro")}
                      placeholder="Digite o logradouro do cliente"
                    />
                    <Input
                      id="numero-cliente"
                      label="Número:"
                      value={formulario.numero}
                      onChange={atualizarCampo("numero")}
                      placeholder="Digite o número do cliente"
                    />
                    <Input
                      id="complemento-cliente"
                      label="Complemento:"
                      value={formulario.complemento}
                      onChange={atualizarCampo("complemento")}
                      placeholder="Digite o complemento do cliente"
                    />
                  </div>
                </div>

                <div className={styles.cardActionsLeft}>
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

          <footer className={styles.footerActions}>
            <Button
              type="button"
              estilo="editar"
              onClick={() => voltarParaClientes()}
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

export default CadastrarCliente;