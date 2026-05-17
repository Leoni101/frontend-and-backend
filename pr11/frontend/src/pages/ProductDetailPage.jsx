import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const res = await api.getProductById(id);
            setProduct(res.data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Товар не найден");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error-page">{error}</div>;
    if (!product) return null;

    return (
        <div className="product-detail">
            <button className="back-btn" onClick={() => navigate("/products")}>
                ← Назад к товарам
            </button>
            
            <div className="product-detail__card">
                {/* Фото товара */}
                {product.image && (
                    <img 
                        className="product-detail__image" 
                        src={product.image} 
                        alt={product.title}
                    />
                )}
                
                <h1>{product.title}</h1>
                
                <div className="product-detail__category">
                    Категория: {product.category}
                </div>
                
                <p className="product-detail__description">
                    {product.description}
                </p>
                
                <div className="product-detail__price">
                    {product.price} ₽
                </div>
                
                {product.createdBy && (
                    <div className="product-detail__meta">
                        <small>ID товара: {product.id}</small>
                    </div>
                )}
            </div>
        </div>
    );
}