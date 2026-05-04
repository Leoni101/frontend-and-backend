import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.login({ email, password });
            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка входа");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Вход</h2>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit" disabled={loading}>{loading ? "Загрузка..." : "Войти"}</button>
                </form>
                <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
            </div>
        </div>
    );
}