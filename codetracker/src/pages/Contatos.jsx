import Header from "../components/Header";

function Contatos() {
  return (
    <div>
      <Header />

      <button onClick={() => (window.location.href = "/verMaisCliente")}>
        Cliente
      </button>
      <button onClick={() => (window.location.href = "/verMaisFornecedor")}>
        Fornecedor
      </button>
    </div>
  );
}

export default Contatos;
