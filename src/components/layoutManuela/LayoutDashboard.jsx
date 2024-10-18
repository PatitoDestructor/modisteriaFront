import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "../../theme";
import { useState, useEffect } from "react";
import { useJwt } from "../../context/JWTContext";
import useDecodedJwt from "../../hooks/useJwt";
export default function LayoutDashboard() {
  const { token } = useJwt();
  const payload = useDecodedJwt(token);
  const navigete = useNavigate();

  useEffect(() => {
    (!token || payload?.role.id !== 2) && navigete("/");
  }, []);

  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  return (
    <>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            <Sidebar nombre={payload?.nombre} isSidebar={isSidebar} />
            <main className="content" style={{ flexGrow: 1 }}>
              <Topbar setIsSidebar={setIsSidebar} />
              <Outlet></Outlet>
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
}
