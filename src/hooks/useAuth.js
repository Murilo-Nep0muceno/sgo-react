import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => { // Verifique esta linha de export
  return useContext(AuthContext);
};