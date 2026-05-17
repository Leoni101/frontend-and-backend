const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

// ========== КОНСТАНТЫ ==========
const ACCESS_SECRET = "access_secret_key_2025";
const REFRESH_SECRET = "refresh_secret_key_2025";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const SALT_ROUNDS = 10;

const ROLES = {
    USER: 'user',
    SELLER: 'seller',
    ADMIN: 'admin'
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ ==========
const dataPath = path.join(__dirname, 'data');

function readUsers() {
    try {
        const data = fs.readFileSync(path.join(dataPath, 'users.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
}

function readProducts() {
    try {
        const data = fs.readFileSync(path.join(dataPath, 'products.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeProducts(products) {
    fs.writeFileSync(path.join(dataPath, 'products.json'), JSON.stringify(products, null, 2));
}

function readRefreshTokens() {
    try {
        const data = fs.readFileSync(path.join(dataPath, 'refreshTokens.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeRefreshTokens(tokens) {
    fs.writeFileSync(path.join(dataPath, 'refreshTokens.json'), JSON.stringify(tokens, null, 2));
}

function addRefreshToken(token) {
    const tokens = readRefreshTokens();
    if (!tokens.includes(token)) {
        tokens.push(token);
        writeRefreshTokens(tokens);
    }
}

function removeRefreshToken(token) {
    const tokens = readRefreshTokens();
    const newTokens = tokens.filter(t => t !== token);
    writeRefreshTokens(newTokens);
}

function isValidRefreshToken(token) {
    const tokens = readRefreshTokens();
    return tokens.includes(token);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

function generateAccessToken(user) {
    return jwt.sign(
        { 
            sub: user.id, 
            email: user.email, 
            role: user.role,
            first_name: user.first_name, 
            last_name: user.last_name 
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// ========== MIDDLEWARE ==========
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

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied. Insufficient permissions" });
        }
        next();
    };
}

// ========== AUTH МАРШРУТЫ ==========

app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const users = readUsers();
    
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: "User already exists" });
    }

    let userRole = ROLES.USER;
    if (users.length === 0) {
        userRole = ROLES.ADMIN;
    }

    const newUser = {
        id: nanoid(8),
        email: email.toLowerCase().trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        hashedPassword: await hashPassword(password),
        role: userRole,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);
    
    const { hashedPassword, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());
    
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: "Account is blocked. Contact administrator" });
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    addRefreshToken(refreshToken);

    res.json({ 
        accessToken, 
        refreshToken, 
        user: { id: user.id, email: user.email, role: user.role } 
    });
});

app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    if (!isValidRefreshToken(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const users = readUsers();
        const user = users.find(u => u.id === payload.sub);
        
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "User not found or blocked" });
        }

        removeRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        addRefreshToken(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        removeRefreshToken(refreshToken);
    }
    res.status(204).send();
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.sub);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ 
        id: user.id, 
        email: user.email, 
        first_name: user.first_name, 
        last_name: user.last_name, 
        role: user.role 
    });
});

// ========== USERS МАРШРУТЫ (только ADMIN) ==========

app.get('/api/users', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const users = readUsers();
    const usersList = users.map(({ hashedPassword, ...user }) => user);
    res.json(usersList);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const { hashedPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.put('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }

    const { first_name, last_name, role } = req.body;
    
    if (first_name !== undefined) users[userIndex].first_name = first_name.trim();
    if (last_name !== undefined) users[userIndex].last_name = last_name.trim();
    if (role !== undefined && [ROLES.USER, ROLES.SELLER, ROLES.ADMIN].includes(role)) {
        users[userIndex].role = role;
    }

    writeUsers(users);
    
    const { hashedPassword, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    
    if (users[userIndex].role === ROLES.ADMIN) {
        const adminCount = users.filter(u => u.role === ROLES.ADMIN).length;
        if (adminCount === 1) {
            return res.status(400).json({ error: "Cannot block the only admin" });
        }
    }
    
    users[userIndex].isActive = false;
    writeUsers(users);
    res.status(204).send();
});

// Разблокировка пользователя
app.patch('/api/users/:id/unblock', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    
    users[userIndex].isActive = true;
    writeUsers(users);
    
    const { hashedPassword, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
});

// ========== PRODUCTS МАРШРУТЫ ==========

app.get('/api/products', authMiddleware, (req, res) => {
    const products = readProducts();
    res.json(products);
});

app.get('/api/products/:id', authMiddleware, (req, res) => {
    const products = readProducts();
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
});

app.post('/api/products', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const { title, category, description, price, image } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const products = readProducts();
    const newProduct = {
        id: nanoid(8),
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        image: image || null,
        createdBy: req.user.sub,
        createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const { title, category, description, price, image } = req.body;
    const products = readProducts();
    const productIndex = products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    products[productIndex].title = title.trim();
    products[productIndex].category = category.trim();
    products[productIndex].description = description.trim();
    products[productIndex].price = Number(price);
    if (image !== undefined) products[productIndex].image = image;
    products[productIndex].updatedAt = new Date().toISOString();

    writeProducts(products);
    res.json(products[productIndex]);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const products = readProducts();
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products.splice(productIndex, 1);
    writeProducts(products);
    res.status(204).send();
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Данные хранятся в папке: ${dataPath}`);
    console.log(`🔐 Соль (bcrypt): ${SALT_ROUNDS} раундов`);
    console.log(`📋 Роли: ${Object.values(ROLES).join(', ')}`);
    console.log(`👑 Первый зарегистрированный пользователь станет администратором`);
});