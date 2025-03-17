import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";

export default function Login() {
    const { login, access, isAdmin, hasRestaurant } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (access) {
            console.log('access', access)
            console.log('isAdmin', isAdmin)
            console.log('hasRestaurant', hasRestaurant)
            if (isAdmin && !hasRestaurant) {
                navigate("/create-restaurant");
            } else {
                navigate("/recipes");
            }
        }
    }, [access, isAdmin, hasRestaurant, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-red">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
                {/* {error && <p className="text-red-500 text-center">{error}</p>} */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="username"
                        placeholder="username"
                        className="w-full p-2 border rounded"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-center mt-4">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
