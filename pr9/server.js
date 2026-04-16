const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Секреты для JWT
const ACCESS_SECRET = "access_secret_key_2025";
const REFRESH_SECRET = "refresh_secret_key_2025";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";  // 15 минут
const REFRESH_EXPIRES_IN = "7d";   // 7 дней

// Middleware
app.use(express.json());

// ==================== Хранилища данных ====================
let users = [];
let products = [];

// Хранилище активных refresh-токенов (в памяти)
const refreshTokens = new Set();

// ==================== Вспомогательные функции ====================
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

// Генерация access-токена
function generateAccessToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            email: user.email, 
            first_name: user.first_name,
            last_name: user.last_name
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

// Генерация refresh-токена
function generateRefreshToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            email: user.email 
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// Middleware для проверки access-токена
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired access token" });
    }
}

// ==================== Swagger настройки ====================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API интернет-магазина с JWT и Refresh токенами',
            version: '1.0.0',
            description: 'API с аутентификацией через JWT токены и обновлением через refresh-токены',
        },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== Auth маршруты ====================

// Регистрация
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

// Вход (выдаем access + refresh токены)
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

    // Генерируем оба токена
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Сохраняем refresh-токен в хранилище
    refreshTokens.add(refreshToken);

    res.json({ 
        accessToken,
        refreshToken
    });
});

// Получение информации о текущем пользователе (защищенный маршрут)
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

// Обновление токенов (refresh)
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    // Проверяем, существует ли токен в хранилище
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        // Верифицируем refresh-токен
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        
        // Находим пользователя
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Ротация токенов: удаляем старый refresh-токен
        refreshTokens.delete(refreshToken);
        
        // Создаем новую пару токенов
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        // Сохраняем новый refresh-токен
        refreshTokens.add(newRefreshToken);
        
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

// Выход из системы (удаляем refresh-токен)
app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken && refreshTokens.has(refreshToken)) {
        refreshTokens.delete(refreshToken);
    }

    res.status(204).send();
});

// ==================== Products маршруты ====================

// Незащищенные (только чтение)
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

// Защищенные (требуют авторизацию)
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
    console.log(`🔐 Access-токен живет: ${ACCESS_EXPIRES_IN}`);
    console.log(`🔄 Refresh-токен живет: ${REFRESH_EXPIRES_IN}`);
});