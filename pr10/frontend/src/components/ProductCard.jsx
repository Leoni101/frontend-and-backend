import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, onEdit, onDelete }) {
    const navigate = useNavigate();

    return (
        <div className="product-card">
            <h3>{product.title}</h3>
            <div className="category">{product.category}</div>
            <p>{product.description}</p>
            <div className="price">{product.price} ₽</div>
            <div className="actions">
                <button onClick={() => navigate(`/products/${product.id}`)}>👁️</button>
                <button onClick={() => onEdit(product)}>✏️</button>
                <button onClick={() => onDelete(product.id)}>🗑️</button>
            </div>
        </div>
    );
}