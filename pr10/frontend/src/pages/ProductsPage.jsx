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

    useEffect(() => {
        loadProducts();
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

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
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
        <div className="products-page">
            <div className="header">
                <h1>Товары</h1>
                <div>
                    <button onClick={() => setModalOpen(true)}>➕ Добавить</button>
                    <button onClick={handleLogout}>🚪 Выйти</button>
                </div>
            </div>
            <div className="products-grid">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} onEdit={setEditingProduct} onDelete={handleDelete} />
                ))}
            </div>
            <ProductModal open={modalOpen} editingProduct={editingProduct} onClose={() => { setModalOpen(false); setEditingProduct(null); }} onSuccess={loadProducts} />
        </div>
    );
}