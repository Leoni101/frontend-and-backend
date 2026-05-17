import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ first_name: "", last_name: "", role: "user" });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.getUsers();
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки пользователей");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setForm({
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        });
        setModalOpen(true);
    };

    const handleBlock = async (id) => {
        if (!window.confirm("Заблокировать пользователя?")) return;
        try {
            await api.deleteUser(id);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert("Ошибка при блокировке");
        }
    };

    const handleUnblock = async (id) => {
        if (!window.confirm("Разблокировать пользователя?")) return;
        try {
            await api.unblockUser(id);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert("Ошибка при разблокировке");
        }
    };

    const handleSave = async () => {
        try {
            await api.updateUser(editingUser.id, form);
            setModalOpen(false);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert("Ошибка при сохранении");
        }
    };

    const handleLogout = () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) api.logout(refreshToken);
        localStorage.clear();
        navigate("/login");
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="users-page">
            <div className="header">
                <h1>👥 Управление пользователями</h1>
                <div>
                    <button onClick={() => navigate("/products")}>📦 Товары</button>
                    <button onClick={handleLogout}>🚪 Выйти</button>
                </div>
            </div>

            <div className="users-grid">
                {users.map(user => (
                    <div key={user.id} className="user-card">
                        <div className="user-info">
                            <strong>{user.first_name} {user.last_name}</strong>
                            <div className="user-email">{user.email}</div>
                            <div className="user-role">Роль: {user.role}</div>
                            <div className="user-status">
                                Статус: {user.isActive === false ? "🔴 Заблокирован" : "🟢 Активен"}
                            </div>
                        </div>
                        <div className="user-actions">
                            <button onClick={() => handleEdit(user)}>✏️ Редактировать</button>
                            
                            {user.isActive === false ? (
                                <button onClick={() => handleUnblock(user.id)} style={{ background: "#27ae60" }}>
                                    🔓 Разблокировать
                                </button>
                            ) : (
                                <button onClick={() => handleBlock(user.id)}>
                                    🔒 Заблокировать
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Редактировать пользователя</h2>
                        <input 
                            type="text" 
                            placeholder="Имя" 
                            value={form.first_name} 
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                        />
                        <input 
                            type="text" 
                            placeholder="Фамилия" 
                            value={form.last_name} 
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                        />
                        <select 
                            value={form.role} 
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="user">Пользователь</option>
                            <option value="seller">Продавец</option>
                            <option value="admin">Администратор</option>
                        </select>
                        <div className="modal-buttons">
                            <button onClick={handleSave}>Сохранить</button>
                            <button onClick={() => setModalOpen(false)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}