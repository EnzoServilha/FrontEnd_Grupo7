import { api } from "./api";

const MENSAGEM_SEM_RESPOSTA =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
const MENSAGEM_SESSAO_EXPIRADA = "Sua sessão expirou. Faça login novamente.";
const MENSAGEM_SERVICO_INDISPONIVEL =
  "O serviço de etiquetas está indisponível no momento. Tente novamente em instantes.";
const MENSAGEM_PADRAO = "Não foi possível solicitar a etiqueta. Tente novamente.";

const mensagemDeErro = (error) => {
  const resposta = error?.response;

  if (!resposta) return MENSAGEM_SEM_RESPOSTA;
  if (resposta.status === 401 || resposta.status === 403) {
    return MENSAGEM_SESSAO_EXPIRADA;
  }

  const mensagemDoServidor = resposta.data?.mensagem;
  if (typeof mensagemDoServidor === "string" && mensagemDoServidor.trim()) {
    return mensagemDoServidor;
  }

  return resposta.status === 503 ? MENSAGEM_SERVICO_INDISPONIVEL : MENSAGEM_PADRAO;
};

const resumirResultado = (total, falhas) => {
  if (falhas.length === 0) {
    return {
      tipo: "sucesso",
      mensagem:
        total === 1
          ? "Solicitação de etiqueta aceita. O PDF será gerado e enviado por e-mail após o processamento."
          : `${total} solicitações de etiqueta aceitas. Os PDFs serão gerados e enviados por e-mail após o processamento.`,
    };
  }

  const motivos = [...new Set(falhas.map((falha) => falha.mensagem))].join(" ");

  if (falhas.length === total) {
    return {
      tipo: "erro",
      mensagem: total === 1 ? motivos : `Nenhuma solicitação foi aceita. ${motivos}`,
    };
  }

  return {
    tipo: "erro",
    mensagem: `${total - falhas.length} de ${total} solicitações aceitas; ${
      falhas.length === 1 ? "1 falhou" : `${falhas.length} falharam`
    }. ${motivos}`,
  };
};

// O backend apenas aceita o pedido (202) e publica na fila; o PDF é gerado e
// enviado por e-mail depois, de forma assíncrona.
export async function solicitarEtiquetas(itemIds) {
  const resultados = await Promise.allSettled(
    itemIds.map((itemId) => api.post(`/etiquetas/${itemId}/fila`)),
  );

  const falhas = [];
  resultados.forEach((resultado, indice) => {
    if (resultado.status === "rejected") {
      console.error(
        `Erro ao solicitar etiqueta do item ${itemIds[indice]}:`,
        resultado.reason,
      );
      falhas.push({
        itemId: itemIds[indice],
        mensagem: mensagemDeErro(resultado.reason),
      });
    }
  });

  return resumirResultado(itemIds.length, falhas);
}
