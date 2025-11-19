import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/api'; 

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    
    // Novo estado para controlar as mensagens (loading, error, success)
    const [message, setMessage] = useState({ text: '', type: '' }); // type: 'loading', 'error', 'success'
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Define a mensagem de progressão
        setMessage({ text: 'Conectando...', type: 'loading' });

        if (!email.trim() || !senha.trim()) {
            setMessage({ text: 'E-mail e senha são obrigatórios.', type: 'error' });
            return;
        }

        try {
            // 2. Tenta fazer o login
            const response = await login(email, senha);
            
            // 3. FLUXO DE SUCESSO
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userEmail', response.data.email);
            
            // Define a mensagem de sucesso
            setMessage({ text: 'Login bem-sucedido! Redirecionando...', type: 'success' });

            // Redireciona para o dashboard após 1 segundo
            setTimeout(() => {
                if (response.data.email === 'admin@simulacao.com') {
                    navigate('/simulacao');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);

        } catch (err) {
            // 4. FLUXO DE ERRO
            console.error("Erro no login:", err);
            
            let errorMessage = 'Email ou senha inválidos.'; 
            if (err.response && err.response.data && typeof err.response.data === 'string') {
                errorMessage = err.response.data;
            } else if (err.code === 'ERR_NETWORK') {
                errorMessage = 'Erro de rede. Não foi possível conectar ao servidor.';
            }
            
            setMessage({ text: errorMessage, type: 'error' });
        }
    };

    // Função para definir a cor da mensagem
    const getMessageStyle = () => {
        if (message.type === 'error') return { color: 'red' };
        if (message.type === 'success') return { color: 'green' };
        if (message.type === 'loading') return { color: 'blue' };
        return {};
    };
    
    const isLoading = message.type === 'loading';

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px', marginTop: '50px' }}>
            <h2 style={{ textAlign: 'center' }}>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading} // Desabilita o botão durante o carregamento
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        backgroundColor: isLoading ? '#adb5bd' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Conectando...' : 'Entrar'}
                </button>
                
                {/* 5. Mensagem de Loading/Erro/Sucesso */}
                {message.text && (
                    <p style={{ ...getMessageStyle(), marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        {message.text}
                    </p>
                )}
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Não tem conta? <Link to="/register">Crie uma aqui</Link>
            </p>
        </div>
    );
};

export default LoginPage;