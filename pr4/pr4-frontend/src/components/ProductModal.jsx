import React, { useState, useEffect } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [rating, setRating] = useState("");

    useEffect(() => {
        if (!open) return;
        setName(initialProduct?.name ?? "");
        setCategory(initialProduct?.category ?? "");
        setDescription(initialProduct?.description ?? "");
        setPrice(initialProduct?.price ?? "");
        setStock(initialProduct?.stock ?? "");
        setRating(initialProduct?.rating ?? "");
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            id: initialProduct?.id,
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            rating: rating ? Number(rating) : 0,
        });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h2>{title}</h2>
                    <button className="modal__close" onClick={onClose}>✖</button>
                </div>
                <form className="modal__form" onSubmit={handleSubmit}>
                    <label>Название</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                    
                    <label>Категория</label>
                    <input value={category} onChange={(e) => setCategory(e.target.value)} required />
                    
                    <label>Описание</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                    
                    <label>Цена (₽)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    
                    <label>Количество на складе</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                    
                    <label>Рейтинг (0-5)</label>
                    <input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
                    
                    <div className="modal__buttons">
                        <button type="button" className="btn btn--cancel" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn--submit">{mode === "edit" ? "Сохранить" : "Создать"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}