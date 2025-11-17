// src/pages/RegisterPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/api'; 
import { Link } from 'react-router-dom'; // Importe o Link para a navegação

const RegisterPage = () => {
    // Estados para os campos do formulário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validação crucial para garantir que as strings não estão vazias
        if (!nome.trim() || !email.trim() || !senha.trim()) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        try {
            // Chama a função register passando as variáveis de estado (strings)
            await register(nome, email, senha); 
            alert('Cadastro realizado com sucesso! Faça login.');
            navigate('/login');
        } catch (err) {
            console.error("Houve um erro no cadastro:", err);
            
            // Tratamento de erro detalhado para o frontend
            let errorMessage = 'Erro desconhecido. Tente novamente.';
            if (err.response && err.response.data) {
                // Se o backend enviar uma mensagem específica, use-a
                errorMessage = typeof err.response.data === 'string' 
                             ? err.response.data 
                             : 'Detalhes de erro: ' + JSON.stringify(err.response.data);
            } else if (err.response && err.response.status === 401) {
                // Caso o erro 401 seja disparado (como o de parsing no Render)
                errorMessage = "Falha de comunicação com o servidor. (Verifique se o usuário já existe).";
            }
            
            setError(`Falha no cadastro: ${errorMessage}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px', marginTop: '50px' }}>
            <h2 style={{ textAlign: 'center' }}>Criar Conta</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Nome"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                    />
                </div>
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
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Registrar
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Já tem conta? <Link to="/login">Fazer Login</Link>
            </p>
        </div>
    );
};

export default RegisterPage;