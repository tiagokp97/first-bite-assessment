import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const register = async (username: string, password: string, restaurantName: string) => {
    const response = await axios.post(`${API_URL}/register/`, { username, password, restaurant_name: restaurantName });
    return response.data;
};

export const login = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/login/`, { username, password });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("access");
};
