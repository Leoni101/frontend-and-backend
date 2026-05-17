// Конфигурация приложения
module.exports = {
    // JWT секреты
    ACCESS_SECRET: "access_secret_key_2025",
    REFRESH_SECRET: "refresh_secret_key_2025",
    
    // Время жизни токенов
    ACCESS_EXPIRES_IN: "15m",  // 15 минут
    REFRESH_EXPIRES_IN: "7d",   // 7 дней
    
    // bcrypt соль (количество раундов)
    SALT_ROUNDS: 10,
    
    // Порты
    PORT: 3000,
    
    // Роли
    ROLES: {
        USER: 'user',
        SELLER: 'seller',
        ADMIN: 'admin'
    }
};