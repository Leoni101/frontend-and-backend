import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";

export default function ProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        loadProducts();
        loadUserRole();
    }, []);

    const loadProducts = async () => {
        try {
            const res = await api.getProducts();
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserRole = async () => {
        try {
            const res = await api.getMe();
            setUserRole(res.data.role);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка при удалении товара");
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleLogout = () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) api.logout(refreshToken);
        localStorage.clear();
        navigate("/login");
    };

    const canEdit = userRole === "seller" || userRole === "admin";
    const canDelete = userRole === "admin";

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="products-page">
            <div className="header">
                <h1>🐾 Зоомагазин «Мягкая лапка»</h1>
                <div>
                    {userRole === "admin" && (
                        <button onClick={() => navigate("/admin/users")}>
                            👥 Пользователи
                        </button>
                    )}
                    {canEdit && (
                        <button onClick={handleAdd}>
                            ➕ Добавить товар
                        </button>
                    )}
                    <button onClick={handleLogout}>
                        🚪 Выйти
                    </button>
                </div>
            </div>
            
            <div className="products-grid">
                {products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                ))}
            </div>
            
            <ProductModal 
                open={modalOpen} 
                editingProduct={editingProduct} 
                onClose={handleCloseModal} 
                onSuccess={loadProducts} 
            />
        </div>
    );
}