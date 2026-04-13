const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ==================== Swagger настройки ====================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина (Зоомагазин)',
            version: '1.0.0',
            description: 'API для управления товарами зоомагазина',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== Схема товара (Swagger) ====================
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *         stock:
 *           type: number
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           description: Рейтинг товара (0-5)
 *       example:
 *         id: "abc123"
 *         name: "Ошейник кожаный CLASSIC"
 *         category: "Аксессуары"
 *         description: "Натуральная кожа, мягкая подкладка"
 *         price: 1490
 *         stock: 15
 *         rating: 4.5
 */

// ==================== Начальные товары ====================
let products = [
    { id: nanoid(6), name: "Ошейник кожаный для кошек", category: "Аксессуары", description: "Натуральная кожа, мягкая подкладка", price: 1490, stock: 15, rating: 4.5, image: "/images/ошейник.jpg" },
    { id: nanoid(6), name: "Корм для кошек Ownat", category: "Корм", description: "Полнорационный сухой корм", price: 990, stock: 25, rating: 4.8, image: "/images/корм.jpg" },
    { id: nanoid(6), name: "Игрушка-мячик", category: "Игрушки", description: "Игрушка-когтеточка из ковролина", price: 350, stock: 40, rating: 4.2, image: "/images/мяч.jpg" },
    { id: nanoid(6), name: "Шлейка-поводок для кошек", category: "Аксессуары", description: "1 метр, регулируемый размер", price: 890, stock: 12, rating: 4.3, image: "/images/шлейка.jpg" },
    { id: nanoid(6), name: "Лежанка мягкая", category: "Дом и лежанки", description: "Съемный чехол, размер M", price: 2450, stock: 8, rating: 4.7, image: "/images/лежанка.jpg" },
    { id: nanoid(6), name: "Миска керамическая", category: "Миски и кормушки", description: "Миска двойная на подставке для кошек", price: 450, stock: 30, rating: 4.4, image: "/images/миска.jpg" },
    { id: nanoid(6), name: "Когтеточка", category: "Дом и лежанки", description: "Когтеточка-столбик с джутом ", price: 1890, stock: 5, rating: 4.6, image: "/images/когтеточка.jpg" },
    { id: nanoid(6), name: "Шампунь гипоаллергенный для кошек", category: "Уход", description: "Для чувствительной кожи", price: 390, stock: 20, rating: 4.5, image: "/images/шампунь.jpg" },
    { id: nanoid(6), name: "Лакомство для кошек Chewell", category: "Лакомства", description: "Крем-суп с тунцом и креветками", price: 120, stock: 100, rating: 4.9, image: "/images/лакомство.jpg" },
    { id: nanoid(6), name: "Переноска для кошек", category: "Транспортировка", description: "Пластиковая, размер L", price: 3200, stock: 3, rating: 4.2, image: "/images/переноска.jpg" }
];

// ==================== Вспомогательные функции ====================
function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// ==================== CRUD маршруты ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/products', (req, res) => {
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    const { name, category, description, price, stock, rating } = req.body;
    
    if (name === undefined && category === undefined && description === undefined && price === undefined && stock === undefined && rating === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
    }
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (rating !== undefined) product.rating = Number(rating);
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    
    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

// Обработчик 404
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
    console.log(`📚 Swagger документация: http://localhost:${port}/api-docs`);
    console.log(`📋 Доступные маршруты:`);
    console.log(`   GET    /api/products`);
    console.log(`   GET    /api/products/:id`);
    console.log(`   POST   /api/products`);
    console.log(`   PATCH  /api/products/:id`);
    console.log(`   DELETE /api/products/:id`);
});