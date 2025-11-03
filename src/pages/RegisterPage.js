import React, { useState } from 'react';
import { registerUser } from '../api/api';
import { Link } from 'react-router-dom'; // Importar Link

const RegisterPage = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        const userData = { nome, email, senha };

        try {
            await registerUser(userData);
            setMessage('Usuário cadastrado com sucesso! Você já pode fazer login.');
            setNome('');
            setEmail('');
            setSenha('');
        } catch (error) {
            setMessage('Erro ao cadastrar usuário.');
            console.error('Houve um erro no cadastro:', error);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Cadastro de Novo Usuário</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Nome:</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Senha:</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Cadastrar
                </button>
            </form>
            {message && <p>{message}</p>}
            <p>
                Já tem uma conta? <Link to="/login">Faça Login</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
