import React from "react";

export default function ProductCard({ product, onEdit, onDelete }) {
    return (
        <div className="product-card">
            <div className="product-card__badge">⭐ {product.rating || "Новинка"}</div>
            <h3 className="product-card__title">{product.name}</h3>
            <div className="product-card__category">{product.category}</div>
            <p className="product-card__description">{product.description}</p>
            <div className="product-card__price">{product.price} ₽</div>
            <div className="product-card__stock">В наличии: {product.stock} шт.</div>
            <div className="product-card__actions">
                <button className="btn btn--edit" onClick={() => onEdit(product)}>✏️ Редактировать</button>
                <button className="btn btn--delete" onClick={() => onDelete(product.id)}>🗑️ Удалить</button>
            </div>
        </div>
    );
}