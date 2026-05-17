import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { "Content-Type": "application/json" },
});

// Добавляем токен в каждый запрос
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Перехватчик для обновления токена
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }
            
            try {
                const response = await axios.post("http://localhost:3000/api/auth/refresh", {
                    refreshToken: refreshToken
                });
                
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return apiClient(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Auth
    register: (data) => apiClient.post("/auth/register", data),
    login: (data) => apiClient.post("/auth/login", data),
    getMe: () => apiClient.get("/auth/me"),
    logout: (refreshToken) => apiClient.post("/auth/logout", { refreshToken }),
    
    // Products
    getProducts: () => apiClient.get("/products"),
    getProductById: (id) => apiClient.get(`/products/${id}`),
    createProduct: (data) => apiClient.post("/products", data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
    
    // Users (только для админа)
    getUsers: () => apiClient.get("/users"),
    getUserById: (id) => apiClient.get(`/users/${id}`),
    updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/users/${id}`),
    unblockUser: (id) => apiClient.patch(`/users/${id}/unblock`, {}),
};