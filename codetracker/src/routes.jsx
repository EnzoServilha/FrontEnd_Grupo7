import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ContaInativa from "./pages/ContaInativa";
import Dashboard from "./pages/Dashboard";
import Pecas from "./pages/Pecas";
import Pedidos from "./pages/Pedidos";
import Contatos from "./pages/Contatos";
import Periodo from "./pages/Periodo";
import VerMaisCliente from "./pages/VerMaisCliente";
import VerMaisFornecedor from "./pages/VerMaisFornecedor";
import VerMaisPecas from "./pages/VerMaisPecas";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/cadastro",
    element: <Cadastro />,
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
    path: "*",
    element: <div>Erro 404: Página não encontrada</div>,
  },
]);
