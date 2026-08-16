import Header from "../components/Header";

function Pedidos() {
  return (
    <div>
      <Header />
      <button onClick={() => (window.location.href = "/verMaisPedido")}>
        Ver Mais
      </button>
    </div>
  );
}

export default Pedidos;
