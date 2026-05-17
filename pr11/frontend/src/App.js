import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
                <Route path="/products/:id" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                <Route path="/" element={<Navigate to="/products" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
