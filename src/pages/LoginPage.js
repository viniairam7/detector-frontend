import React, { useState } from 'react';
// Importamos a função 'loginUser' do nosso api.js corrigido
import { loginUser } from '../api/api'; 

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [message, setMessage] = useState('');

    // AQUI USAMOS SUA NOVA LÓGICA DE LOGIN:
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            // 1. FAZ A REQUISIÇÃO USANDO A FUNÇÃO DO 'api.js'
            const response = await loginUser({
                email: email,
                senha: senha
            });

            // 2. EXTRAI O TOKEN DA RESPOSTA
            const token = response.data.token; 

            // 3. SALVA O TOKEN NO ARMAZENAMENTO LOCAL (Sua melhoria!)
            if (token) {
                localStorage.setItem('userToken', token);
                setMessage("Login bem-sucedido. Token salvo!");
                // Idealmente, redirecionaríamos o usuário para o Dashboard aqui
            }

        } catch (error) {
            console.error("Erro no login:", error);
            setMessage("Erro ao fazer login. Verifique seu e-mail e senha.");
        }
    };

    // O HTML (JSX) do formulário continua o mesmo
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Senha:</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Entrar</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default LoginPage;