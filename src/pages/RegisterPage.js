// Local: src/pages/RegisterPage.js
import React, { useState } from 'react';
import { registerUser } from '../api/api'; // Importa nossa função da API

const RegisterPage = () => {
    // 'useState' cria "variáveis de estado" para guardar o que o usuário digita
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [message, setMessage] = useState(''); // Para exibir mensagens de sucesso/erro

    // Função que é chamada quando o usuário clica no botão "Cadastrar"
    const handleSubmit = async (event) => {
        event.preventDefault(); // Impede que a página recarregue
        setMessage(''); // Limpa a mensagem anterior

        const userData = {
            nome: nome,
            email: email,
            senha: senha
        };

        try {
            // Chama a função da API e espera a resposta do backend
            const response = await registerUser(userData);
            setMessage(`Usuário cadastrado com sucesso! ID: ${response.data.id}`);
            // Limpa os campos do formulário após o sucesso
            setNome('');
            setEmail('');
            setSenha('');
        } catch (error) {
            // Se o backend retornar um erro, nós o exibimos aqui
            setMessage('Erro ao cadastrar usuário. Verifique os dados e tente novamente.');
            console.error('Houve um erro no cadastro:', error);
        }
    };

    return (
        <div>
            <h2>Cadastro de Novo Usuário</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nome:</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>
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
                <button type="submit">Cadastrar</button>
            </form>
            {/* Exibe a mensagem de sucesso ou erro aqui */}
            {message && <p>{message}</p>}
        </div>
    );
};

export default RegisterPage;
