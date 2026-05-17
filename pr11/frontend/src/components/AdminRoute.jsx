import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../api";

export default function AdminRoute({ children }) {
    const token = localStorage.getItem("accessToken");
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.getMe()
                .then(res => {
                    setRole(res.data.role);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    if (loading) return <div className="loading">Проверка прав...</div>;
    if (!token) return <Navigate to="/login" replace />;
    if (role !== "admin") return <div className="error-page">Доступ запрещён. Требуются права администратора.</div>;
    
    return children;
}