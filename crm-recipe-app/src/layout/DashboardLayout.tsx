import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export default function DashboardLayout() {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen w-full bg-gray-100">
            <div className="bg-[#1e1e1f] text-white w-64 p-5 flex flex-col">
                <h1 className="text-xl font-bold mt-2">FirstBite CRM</h1>
                <nav className="space-y-4 mt-4">
                    <Link to="/recipes" className="block p-2 rounded hover:bg-gray-700">📜 Recipe List</Link>
                    <Link to="/create" className="block p-2 rounded hover:bg-gray-700">➕ Create Recipe</Link>
                    <Link to="/import" className="block p-2 rounded hover:bg-gray-700">🔎 Import Recipe</Link>
                    <button onClick={logout} className="mt-4 text-red-400 hover:text-red-600">
                        Logout
                    </button>
                </nav>
            </div>
            <div className="flex-1 p-6">
                <Outlet />
            </div>
        </div>
    );
}
