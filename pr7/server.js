const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// ==================== Хранилища данных (в памяти) ====================
let users = [];      // массив пользователей
let products = [];   // массив товаров

// ==================== Вспомогательные функции ====================
async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

function findUserByEmail(email, res) {
    const user = users.find(u => u.email === email);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
    }
    return user;
}

function findProductById(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// ==================== Swagger настройки ====================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина с авторизацией',
            version: '1.0.0',
            description: 'API для управления пользователями и товарами',
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

// ==================== Swagger схемы ====================
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID
 *         email:
 *           type: string
 *           description: Email пользователя (используется как логин)
 *         first_name:
 *           type: string
 *           description: Имя
 *         last_name:
 *           type: string
 *           description: Фамилия
 *         password:
 *           type: string
 *           description: Пароль (хешируется)
 *       example:
 *         id: "abc123"
 *         email: "ivan@example.com"
 *         first_name: "Иван"
 *         last_name: "Петров"
 *         password: "qwerty123"
 *     
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID
 *         title:
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
 *           description: Цена товара
 *       example:
 *         id: "def456"
 *         title: "Ошейник кожаный"
 *         category: "Аксессуары"
 *         description: "Натуральная кожа"
 *         price: 1490
 */

// ==================== Auth маршруты ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Пользователь уже существует
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    // Проверка обязательных полей
    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Проверка, существует ли пользователь
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
    }

    // Создание нового пользователя
    const newUser = {
        id: nanoid(8),
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        hashedPassword: await hashPassword(password),
    };

    users.push(newUser);
    
    // Возвращаем пользователя без пароля
    const { hashedPassword, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *       400:
 *         description: Отсутствуют поля
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await verifyPassword(password, user.hashedPassword);
    if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
    }

    res.status(200).json({ 
        message: "Login successful",
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }
    });
});

// ==================== Products маршруты (CRUD) ====================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/products', (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const newProduct = {
        id: nanoid(8),
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductById(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Полностью обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const product = findProductById(id, res);
    if (!product) return;

    product.title = title.trim();
    product.category = category.trim();
    product.description = description.trim();
    product.price = Number(price);

    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    products.splice(productIndex, 1);
    res.status(204).send();
});

// ==================== Запуск сервера ====================
app.listen(port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📚 Swagger документация: http://localhost:${port}/api-docs`);
    console.log(`📋 Доступные маршруты:`);
    console.log(`   POST   /api/auth/register - регистрация`);
    console.log(`   POST   /api/auth/login    - вход`);
    console.log(`   POST   /api/products      - создать товар`);
    console.log(`   GET    /api/products      - все товары`);
    console.log(`   GET    /api/products/:id  - товар по ID`);
    console.log(`   PUT    /api/products/:id  - обновить товар`);
    console.log(`   DELETE /api/products/:id  - удалить товар`);
});