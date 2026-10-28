const texts = import.meta.glob("./texts/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});

const pages = {
  "/": ["Acesso ao sistema", "login"],
  "/inativa": ["Conta inativa", "contaInativa"],
  "/dashboard": ["Dashboard", "dashboard"],
  "/pecas": ["Catálogo de peças", "pecas"],
  "/entradasESaidas": ["Entradas e saídas", "entradasESaidas"],
  "/cadastrarPeca": ["Cadastrar peça", "cadastrarPeca"],
  "/verMaisPeca": ["Detalhes da peça", "verMaisPeca"],
  "/associarCodigo": ["Associar código", "associarCodigo"],
  "/assimilarPecas": ["Assimilar peças", "assimilarPecas"],
  "/contatos": ["Contatos", "contatos"],
  "/cadastrarCliente": ["Cadastrar cliente", "cadastrarCliente"],
  "/cadastrarFornecedor": ["Cadastrar fornecedor", "cadastrarFornecedor"],
  "/cadastrarUsuario": ["Cadastrar usuário", "cadastrarUsuario"],
  "/verMaisCliente": ["Detalhes do cliente", "verMaisCliente"],
  "/verMaisFornecedor": ["Detalhes do fornecedor", "verMaisFornecedor"],
  "/pedidos": ["Pedidos", "pedidos"],
  "/cadastrarPedido": ["Cadastrar pedido", "cadastrarPedido"],
  "/verMaisPedido": ["Detalhes do pedido", "verMaisPedido"],
  "/periodo": ["Períodos", "periodo"],
  "/usuarios": ["Usuários", "usuarios"],
};

export function getHelpContent(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const page = pages[normalizedPath];

  if (!page) {
    return {
      title: "Ajuda",
      text: "Ainda não há uma explicação disponível para esta tela.",
    };
  }

  const [title, filename] = page;

  return {
    title,
    text:
      texts[`./texts/${filename}.txt`] ??
      "O texto de ajuda desta tela não foi encontrado.",
  };
}