import { createContext, useContext } from "react";

export const HelpContext = createContext(null);

export function useHelp() {
  const context = useContext(HelpContext);

  if (context === null) {
    throw new Error("useHelp deve ser usado dentro de HelpProvider.");
  }

  return context;
}