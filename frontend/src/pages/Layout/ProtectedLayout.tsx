import { Outlet } from "react-router";
import Unauthorized from "../Error/Unauthorized";
import NotFound from "../Error/NotFound";
import InternalServerError from "../Error/InternalServerError";
import { useAppSelector } from "../../store";

export function ProtectedLayout() {
  const errorState = useAppSelector((state) => state.error);

  if (errorState[401]) return <Unauthorized />;
  if (errorState[404]) return <NotFound />;
  if (errorState[500]) return <InternalServerError />;

  return <Outlet />;
}
