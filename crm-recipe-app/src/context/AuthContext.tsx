import { createContext, useContext, useState, useEffect } from "react";
import { login as loginRequest, register as registerRequest, logout as logoutRequest } from "../api/auth.ts";

interface User {
    id: string;
    username: string;
    role: "admin" | "user";
    restaurant?: string;
}

interface AuthContextProps {
    access: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, restaurantName: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    hasRestaurant: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [access, setAccess] = useState<string | null>(localStorage.getItem("access"));


    useEffect(() => {
        const storedAccess = localStorage.getItem("access");

        if (storedAccess) {
            setAccess(storedAccess);
            fetchUserProfile(storedAccess);
        }
    }, [access]);

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/profile/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user profile");
            }

            const userData = await response.json();
            setUser(userData);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            logout();
        }
    };

    const login = async (username: string, password: string) => {
        const data = await loginRequest(username, password);
        localStorage.setItem("access", data.access);
        setAccess(data.access);
        setUser(data.user);
    };

    const register = async (username: string, password: string, restaurantName: string) => {
        await registerRequest(username, password, restaurantName);
    };

    const logout = () => {
        localStorage.removeItem("access");
        logoutRequest();
        setUser(null);
        setAccess(null);
    };

    return (
        <AuthContext.Provider
            value={{
                access,
                login,
                register,
                logout,
                isAdmin: user?.role === "admin",
                hasRestaurant: !!user?.restaurant,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
