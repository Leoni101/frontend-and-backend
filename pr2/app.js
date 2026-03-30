const express = require('express');
const app = express();
const port = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`📝 ${new Date().toLocaleTimeString()} | ${req.method} ${req.url}`);
    next();
});

// Массив товаров
let products = [
    { id: 1, name: 'Ошейник кожаный "CLASSIC"', price: 1490 },
    { id: 2, name: 'Корм для собак "Premium"', price: 990 },
    { id: 3, name: 'Игрушка-мячик', price: 350 }
];

// GET /products - получить все товары
app.get('/products', (req, res) => {
    res.json(products);
});

// GET /products/:id - получить товар по ID
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

// POST /products - добавить новый товар
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Необходимо указать name и price' });
    }
    
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price
    };
    
    products.push(newProduct);
    console.log(`✅ Добавлен товар: ${name} (${price}₽)`);
    res.status(201).json(newProduct);
});

// PATCH /products/:id - редактировать товар
app.patch('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    
    console.log(`✏️ Изменен товар ID: ${id}`);
    res.json(product);
});

// DELETE /products/:id - удалить товар
app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);
    
    console.log(`🗑️ Удален товар: ${deletedProduct.name}`);
    res.json({ message: 'Товар удален' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📋 Доступные маршруты:`);
    console.log(`   GET    /products`);
    console.log(`   GET    /products/:id`);
    console.log(`   POST   /products`);
    console.log(`   PATCH  /products/:id`);
    console.log(`   DELETE /products/:id`);
});