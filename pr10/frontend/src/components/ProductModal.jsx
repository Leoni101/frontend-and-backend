import { useState, useEffect } from "react";
import { api } from "../api";

export default function ProductModal({ open, editingProduct, onClose, onSuccess }) {
    const [form, setForm] = useState({ title: "", category: "", description: "", price: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingProduct) {
            setForm(editingProduct);
        } else {
            setForm({ title: "", category: "", description: "", price: "" });
        }
    }, [editingProduct]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, form);
            } else {
                await api.createProduct(form);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editingProduct ? "Редактировать" : "Новый товар"}</h2>
                <form onSubmit={handleSubmit}>
                    <input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    <input placeholder="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                    <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                    <input type="number" placeholder="Цена" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    <button type="submit" disabled={loading}>{loading ? "Сохранение..." : "Сохранить"}</button>
                    <button type="button" onClick={onClose}>Отмена</button>
                </form>
            </div>
        </div>
    );
}