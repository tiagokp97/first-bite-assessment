import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.tsx";
import AuthLayout from "../layout/AuthLayout.tsx";
import DashboardLayout from "../layout/DashboardLayout.tsx";
import Login from "../pages/auth/Login.tsx";
import Register from "../pages/auth/Register.tsx";
import RecipeList from "../pages/dashBoard/RecipeList.tsx";
import CreateRecipe from "../pages/dashBoard/CreateRecipe.tsx";

import ImportRecipe from "../pages/dashBoard/ImportRecipe.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/recipes" element={<RecipeList />} />
                    <Route path="/create" element={<CreateRecipe />} />
                    <Route path="/import" element={<ImportRecipe />} />
                </Route>
            </Route>
        </Routes>
    );
}
