import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import ContaInativa from "./pages/ContaInativa";
import Dashboard from "./pages/Dashboard";
import Pecas from "./pages/Pecas";
import Pedidos from "./pages/Pedidos";
import Contatos from "./pages/Contatos";
import Periodo from "./pages/Periodo";
import VerMaisCliente from "./pages/VerMaisCliente";
import VerMaisFornecedor from "./pages/VerMaisFornecedor";
import VerMaisPecas from "./pages/VerMaisPecas";
import AssociarCodigo from "./pages/AssociarCodigo";
import AssimilarPecas from "./pages/AssimilarPecas";
import VerMaisPedidos from "./pages/VerMaisPedidos";
import CadastrarCliente from "./pages/CadastrarCliente";
import CadastrarFornecedor from "./pages/CadastrarFornecedor";
import CadastrarPeca from "./pages/CadastrarPeca";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/inativa",
    element: <ContaInativa />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/pecas",
    element: <Pecas />,
  },
  {
    path: "/pedidos",
    element: <Pedidos />,
  },
  {
    path: "/contatos",
    element: <Contatos />,
  },
  {
    path: "/cadastrarCliente",
    element: <CadastrarCliente />,
  },
  {
    path: "/cadastrarFornecedor",
    element: <CadastrarFornecedor />,
  },
  {
    path: "/cadastrarPeca",
    element: <CadastrarPeca />,
  },
  {
    path: "/periodo",
    element: <Periodo />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/verMaisCliente",
    element: <VerMaisCliente />,
  },
  {
    path: "/verMaisFornecedor",
    element: <VerMaisFornecedor />,
  },
  {
    path: "/verMaisPeca",
    element: <VerMaisPecas />,
  },
  {
    path: "/associarCodigo",
    element: <AssociarCodigo />,
  },
  {
    path: "/assimilarPecas",
    element: <AssimilarPecas />,
  },
  {
    path: "/verMaisPedido",
    element: <VerMaisPedidos />,
  },
  {
    path: "*",
    element: <div>Erro 404: Página não encontrada</div>,
  },
]);
