import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransacoesPage from './pages/TransacoesPage';
import './App.css'; 
import SimulacaoPage from './pages/SimulacaoPage';

// --- CORREÇÃO 1 (AQUI) ---
// Função de verificação de login (procurando pela chave 'token')
const estaLogado = () => {
    return localStorage.getItem('token') !== null; // <-- Mudado de 'userToken' para 'token'
};

const ehAdmin = () => {
    const email = localStorage.getItem('userEmail');
    return email === 'admin@simulacao.com'; // <--- DEFINA O EMAIL DO ADMIN AQUI
};

// Componente de Rota Protegida
const ProtectedRoute = ({ children }) => {
    if (!estaLogado()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AdminRoute = ({ children }) => {
    if (!estaLogado()) {
        return <Navigate to="/login" replace />;
    }
    if (!ehAdmin()) {
        // Se logado mas não é admin, manda pro dashboard normal
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

// Layout Principal (com Navbar e Estilos)
const MainLayout = ({ children }) => {
    
    // --- CORREÇÃO 2 (AQUI) ---
    // O Logout também deve remover a chave 'token'
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail'); // <-- Mudado de 'userToken' para 'token'
        window.location.href = '/login'; 
    };

    return (
        <div>
            <header className="app-header">
                <h1>detector</h1>
            </header>
            
            <nav className="main-nav">
                <Link to="/dashboard">Dashboard</Link>
                <button onClick={handleLogout} className="logout-button">
                    Sair
                </button>
            </nav>
            
            <main className="page-container">
                {children}
            </main>
        </div>
    );
};

// App principal
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Rotas Normais */}
                <Route path="/dashboard" element={
                    <ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>
                } />
                <Route path="/cartao/:cartaoId/transacoes" element={
                    <ProtectedRoute><MainLayout><TransacoesPage /></MainLayout></ProtectedRoute>
                } />

                {/* ROTA DE SIMULAÇÃO (PROTEGIDA PARA ADMIN) */}
                <Route path="/simulacao" element={
                    <AdminRoute>
                        <MainLayout>
                            <SimulacaoPage />
                        </MainLayout>
                    </AdminRoute>
                } />

                <Route path="*" element={<Navigate to={estaLogado() ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </Router>
    );
}

export default App;