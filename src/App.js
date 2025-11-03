import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransacoesPage from './pages/TransacoesPage'; // Vamos criar esta página

// Função simples para verificar se o usuário está logado (se tem um token)
const estaLogado = () => {
    return localStorage.getItem('userToken') !== null;
};

// Componente que protege rotas
const ProtectedRoute = ({ children }) => {
    if (!estaLogado()) {
        // Se não estiver logado, redireciona para a página de login
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Componente para o layout principal com navegação
const MainLayout = ({ children }) => {
    const handleLogout = () => {
        localStorage.removeItem('userToken');
        // Força o recarregamento da página para /login
        window.location.href = '/login'; 
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <nav style={{ background: '#333', padding: '1rem', color: 'white' }}>
                <Link to="/dashboard" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Dashboard</Link>
                {/* Adicione outros links aqui se precisar */}
                <button onClick={handleLogout} style={{ float: 'right', background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                    Sair
                </button>
            </nav>
            <main style={{ padding: '2rem' }}>
                {children}
            </main>
        </div>
    );
};

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
