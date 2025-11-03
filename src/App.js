import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransacoesPage from './pages/TransacoesPage';
import './App.css'; // <-- VERIFIQUE SE ESTA LINHA ESTÁ AQUI

// Função de verificação de login
const estaLogado = () => {
    return localStorage.getItem('userToken') !== null;
};

// Componente de Rota Protegida
const ProtectedRoute = ({ children }) => {
    if (!estaLogado()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Layout Principal (com Navbar e Estilos)
const MainLayout = ({ children }) => {
    const handleLogout = () => {
        localStorage.removeItem('userToken');
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
                {/* Rotas Públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Rotas Privadas (Protegidas) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <DashboardPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cartao/:cartaoId/transacoes"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <TransacoesPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Rota Padrão */}
                <Route
                    path="*"
                    element={<Navigate to={estaLogado() ? "/dashboard" : "/login"} replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;
