import { RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import HelpProvider from "./helpfeat/HelpProvider";

function App() {
  return (
    <HelpProvider>
      <RouterProvider router={routes} />
    </HelpProvider>
  );
}


export default App;