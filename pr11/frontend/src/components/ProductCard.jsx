import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, onEdit, onDelete, canEdit, canDelete }) {
    const navigate = useNavigate();

    return (
        <div className="product-card">
            {product.image && (
                <img className="product-card__image" src={product.image} alt={product.title} />
            )}
            <h3>{product.title}</h3>
            <div className="category">{product.category}</div>
            <p>{product.description}</p>
            <div className="price">{product.price} ₽</div>
            <div className="actions">
                <button onClick={() => navigate(`/products/${product.id}`)}>👁️</button>
                {canEdit && <button onClick={() => onEdit(product)}>✏️</button>}
                {canDelete && <button onClick={() => onDelete(product.id)}>🗑️</button>}
            </div>
        </div>
    );
}
