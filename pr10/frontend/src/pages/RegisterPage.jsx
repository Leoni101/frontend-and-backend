import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", first_name: "", last_name: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.register(form);
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка регистрации");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Регистрация</h2>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <input placeholder="Имя" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                    <input placeholder="Фамилия" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                    <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    <button type="submit" disabled={loading}>{loading ? "Загрузка..." : "Зарегистрироваться"}</button>
                </form>
                <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
            </div>
        </div>
    );
}