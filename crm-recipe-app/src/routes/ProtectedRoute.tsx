import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export default function ProtectedRoute() {
    const { access } = useAuth();

    return access ? <Outlet /> : <Navigate to="/" />;
}
