import { useCallback, useMemo, useState } from "react";
import { HelpContext } from "./useHelp";

export default function HelpProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openHelp = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openHelp,
      closeHelp,
    }),
    [isOpen, openHelp, closeHelp],
  );

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}