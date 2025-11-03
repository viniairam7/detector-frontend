import React, { useState } from 'react';
import { loginUser } from '../api/api';
import { useNavigate, Link } from 'react-router-dom'; // Precisamos do Link e do useNavigate

const LoginPage = () => {
    // --- LÓGICA IDÊNTICA ---
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Hook para fazer o redirecionamento

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        try {
            // 1. FAZ A REQUISIÇÃO
            const response = await loginUser({ email, senha });
            const token = response.data.token; 

            // 3. SALVA O TOKEN
            if (token) {
                localStorage.setItem('userToken', token);
                setMessage("Login bem-sucedido! Redirecionando...");
                
                // 4. REDIRECIONA PARA O DASHBOARD
                setTimeout(() => {
                    navigate('/dashboard'); 
                }, 1000); // Espera 1 segundo antes de redirecionar
            }
        } catch (error) {
            console.error("Erro no login:", error);
            setMessage("Erro ao fazer login. Verifique seu e-mail e senha.");
        }
    };
    // --- FIM DA LÓGICA ---

    return (
        // Aplicamos os estilos do Bradesco (do App.css)
        <div className="auth-container">
            <h1 style={{ color: 'var(--bradesco-red)', textTransform: 'lowercase', fontSize: '2.5rem' }}>detector</h1>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form-card" style={{ textAlign: 'left' }}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-field" // Classe de estilo
                    />
                </div>
                <div className="form-group">
                    <label>Senha:</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        className="input-field" // Classe de estilo
                    />
                </div>
                <button type="submit" className="btn-primary"> {/* Classe de estilo */}
                    Entrar
                </button>
            </form>
            {/* Mensagem de sucesso ou erro com classes de estilo */}
            {message && <p className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</p>}
            
            {/* Link para a página de Cadastro */}
            <p className="auth-link">
                Não tem uma conta? <Link to="/register" style={{ color: 'var(--bradesco-red)' }}>Cadastre-se</Link>
            </p>
        </div>
    );
};

export default LoginPage;

