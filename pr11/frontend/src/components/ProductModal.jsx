import { useState, useEffect } from "react";
import { api } from "../api";

export default function ProductModal({ open, editingProduct, onClose, onSuccess }) {
    const [form, setForm] = useState({ 
        title: "", 
        category: "", 
        description: "", 
        price: "",
        image: "" 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ОБНОВЛЯЕМ ФОРМУ, КОГДА МЕНЯЕТСЯ editingProduct ИЛИ open
    useEffect(() => {
        if (editingProduct) {
            setForm({
                title: editingProduct.title || "",
                category: editingProduct.category || "",
                description: editingProduct.description || "",
                price: editingProduct.price || "",
                image: editingProduct.image || ""
            });
        } else {
            setForm({ 
                title: "", 
                category: "", 
                description: "", 
                price: "", 
                image: "" 
            });
        }
        setError("");
    }, [editingProduct, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, form);
                alert("Товар успешно обновлён!");
            } else {
                await api.createProduct(form);
                alert("Товар успешно создан!");
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Ошибка при сохранении товара");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{editingProduct ? "Редактировать товар" : "Добавить товар"}</h2>
                
                {error && <div className="error">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Название товара" 
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        required 
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Категория" 
                        value={form.category} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })} 
                        required 
                    />
                    
                    <textarea 
                        placeholder="Описание товара" 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        required 
                    />
                    
                    <input 
                        type="number" 
                        placeholder="Цена (₽)" 
                        value={form.price} 
                        onChange={(e) => setForm({ ...form, price: e.target.value })} 
                        required 
                    />
                    
                    <input 
                        type="text" 
                        placeholder="Ссылка на фото" 
                        value={form.image} 
                        onChange={(e) => setForm({ ...form, image: e.target.value })} 
                    />
                    
                    <div className="modal-buttons">
                        <button type="submit" disabled={loading}>
                            {loading ? "Сохранение..." : (editingProduct ? "Сохранить" : "Создать")}
                        </button>
                        <button type="button" onClick={onClose}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}