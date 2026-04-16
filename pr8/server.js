const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Секретный ключ для JWT (в реальном проекте хранить в .env)
const JWT_SECRET = "my_super_secret_key_2025";
const ACCESS_EXPIRES_IN = "1h";

// Middleware
app.use(express.json());

// ==================== Хранилища данных ====================
let users = [];
let products = [];

// ==================== Вспомогательные функции ====================
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

// Middleware для проверки JWT токена
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// ==================== Swagger настройки ====================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина с JWT авторизацией',
            version: '1.0.0',
            description: 'API с аутентификацией через JWT токены',
        },
        servers: [{ url: `http://localhost:${port}` }],
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
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
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
 *         title:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 */

// ==================== Auth маршруты ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
    }

    const newUser = {
        id: nanoid(8),
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        hashedPassword: await hashPassword(password),
    };

    users.push(newUser);
    const { hashedPassword, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (выдает JWT токен)
 *     tags: [Auth]
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Создаем JWT токен
    const accessToken = jwt.sign(
        { 
            sub: user.id, 
            email: user.email, 
            first_name: user.first_name,
            last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.json({ 
        accessToken,
        expiresIn: ACCESS_EXPIRES_IN,
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        }
    });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе (защищенный маршрут)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
    });
});

// ==================== Products маршруты (незащищенные) ====================

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
});

// ==================== Products маршруты (защищенные - требуют JWT) ====================

app.post('/api/products', authMiddleware, (req, res) => {
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
        createdBy: req.user.sub,
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const { title, category, description, price } = req.body;
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    product.title = title.trim();
    product.category = category.trim();
    product.description = description.trim();
    product.price = Number(price);

    res.json(product);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);

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
    console.log(`🔐 Защищенные маршруты требуют JWT токен в заголовке Authorization: Bearer <token>`);
});