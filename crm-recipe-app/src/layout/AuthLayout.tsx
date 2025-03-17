import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="flex justify-center items-center h-screen bg-[#1e1e1f]">
            <Outlet />
        </div>
    );
}
