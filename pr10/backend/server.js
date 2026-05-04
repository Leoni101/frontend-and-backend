const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

// Секреты
const ACCESS_SECRET = "access_secret_key_2025";
const REFRESH_SECRET = "refresh_secret_key_2025";

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

// Хранилища
let users = [];
let products = [];
const refreshTokens = new Set();

// Вспомогательные функции
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

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

// ========== AUTH МАРШРУТЫ ==========

app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (users.find(u => u.email === email)) {
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken && refreshTokens.has(refreshToken)) {
        refreshTokens.delete(refreshToken);
    }
    res.status(204).send();
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });
});

// ========== PRODUCTS МАРШРУТЫ ==========

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
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    products.splice(index, 1);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`🚀 Сервер на http://localhost:${port}`);
});