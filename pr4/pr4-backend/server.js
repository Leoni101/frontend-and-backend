const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Начальные товары (10 штук)
let products = [
    { id: nanoid(6), name: "Ошейник кожаный CLASSIC", category: "Аксессуары", description: "Натуральная кожа, мягкая подкладка", price: 1490, stock: 15, rating: 4.5 },
    { id: nanoid(6), name: "Корм для собак Premium", category: "Корм", description: "Полнорационный сухой корм", price: 990, stock: 25, rating: 4.8 },
    { id: nanoid(6), name: "Игрушка-мячик", category: "Игрушки", description: "Прочный резиновый мяч", price: 350, stock: 40, rating: 4.2 },
    { id: nanoid(6), name: "Поводок-рулетка", category: "Аксессуары", description: "5 метров, автоматическая фиксация", price: 890, stock: 12, rating: 4.3 },
    { id: nanoid(6), name: "Лежанка мягкая", category: "Дом и лежанки", description: "Съемный чехол, размер M", price: 2450, stock: 8, rating: 4.7 },
    { id: nanoid(6), name: "Витамины для шерсти", category: "Здоровье", description: "Комплекс для блестящей шерсти", price: 450, stock: 30, rating: 4.4 },
    { id: nanoid(6), name: "Когтеточка", category: "Для кошек", description: "Настенная, с когтеточкой и домиком", price: 1890, stock: 5, rating: 4.6 },
    { id: nanoid(6), name: "Шампунь гипоаллергенный", category: "Уход", description: "Для чувствительной кожи", price: 390, stock: 20, rating: 4.5 },
    { id: nanoid(6), name: "Лакомство для собак", category: "Лакомства", description: "Натуральные палочки", price: 120, stock: 100, rating: 4.9 },
    { id: nanoid(6), name: "Переноска для кошек", category: "Транспортировка", description: "Пластиковая, размер L", price: 3200, stock: 3, rating: 4.2 }
];

// Функция поиска товара
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// GET /api/products - получить все товары
app.get("/api/products", (req, res) => {
    res.json(products);
});

// GET /api/products/:id - получить товар по ID
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

// POST /api/products - создать новый товар
app.post("/api/products", (req, res) => {
    const { name, category, description, price, stock, rating } = req.body;
    
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 0
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PATCH /api/products/:id - редактировать товар
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    const { name, category, description, price, stock, rating } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (rating !== undefined) product.rating = Number(rating);
    
    res.json(product);
});

// DELETE /api/products/:id - удалить товар
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

// 404 для остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📋 Доступные маршруты:`);
    console.log(`   GET    /api/products`);
    console.log(`   GET    /api/products/:id`);
    console.log(`   POST   /api/products`);
    console.log(`   PATCH  /api/products/:id`);
    console.log(`   DELETE /api/products/:id`);
});