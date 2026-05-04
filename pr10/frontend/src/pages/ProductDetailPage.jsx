import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            const res = await api.getProductById(id);
            setProduct(res.data);
        } catch (err) {
            console.error(err);
            navigate("/products");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            navigate("/products");
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!product) return null;

    return (
        <div className="product-detail">
            <button className="back-btn" onClick={() => navigate("/products")}>← Назад</button>
            <div className="product-detail__card">
                <h1>{product.title}</h1>
                <div className="category">Категория: {product.category}</div>
                <p>{product.description}</p>
                <div className="price">{product.price} ₽</div>
                <div className="actions">
                    <button onClick={() => navigate(`/products/${id}/edit`)}>✏️ Редактировать</button>
                    <button onClick={handleDelete}>🗑️ Удалить</button>
                </div>
            </div>
        </div>
    );
}