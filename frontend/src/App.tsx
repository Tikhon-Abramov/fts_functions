import { useAppDispatch, useAppSelector } from "./store";
import { Navigate, useLocation } from "react-router";
import { Route, Routes } from "react-router";
import Login from "./pages/Login/Login";
// import Home from "./pages/Home";
import NotFound from "./pages/Error/NotFound";
import Unauthorized from "./pages/Error/Unauthorized";
import { useEffect } from "react";
import { resetAllErrors } from "./store/errorSlice";
import { registerToastAction } from "./store/toastActions";
import { Layout } from "./pages/Layout/Layout";
import { FtsFunctions } from "./pages/FtsFunctions/FtsFunctions";




function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuth = !!user;
  const location = useLocation();


  useEffect(() => {
    dispatch(resetAllErrors());
  }, [location.pathname]);

  registerToastAction('reload', () => window.location.reload());

  if (isAuth) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<FtsFunctions />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Unauthorized />} />
      </Routes>
  );
}

export default App;
