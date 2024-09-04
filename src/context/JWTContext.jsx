import { createContext, useContext, useEffect, useState } from "react";

const JWTContext = createContext();
export const useJwt = () => {
  return useContext(JWTContext);
};
export default function JWTProvider({ children }) {
  const [token, setToken] = useState(null);
  const cleanToken = () => {
    localStorage.removeItem("jwt");
    setToken(null);
  };
  const saveToken = (token) => {
    localStorage.setItem("jwt", token);
    setToken(token);
  };
  useEffect(() => {
    if (localStorage.getItem("jwt")) setToken(localStorage.getItem("jwt"));
  }, []);
  return (
    <JWTContext.Provider value={{ token, saveToken, cleanToken }}>
      {children}
    </JWTContext.Provider>
  );
}
