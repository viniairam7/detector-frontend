// Local: src/pages/DashboardPage.js
import React, { useState } from 'react';
import { adicionarCartao } from '../api/api'; // Importa a função da API

const DashboardPage = () => {
    // Estados para o formulário de novo cartão
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');
    const [message, setMessage] = useState('');

    // ** IMPORTANTE **
    // Para adicionar um cartão, precisamos do ID do usuário.
    // Em um app real, o token JWT conteria o ID do usuário, ou
    // o buscaríamos de um perfil. Por AGORA, vamos pedir
    // para o usuário digitar o ID dele manualmente.
    const [usuarioId, setUsuarioId] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        const cartaoData = {
            numero: numero,
            validade: validade,
            nomeTitular: nomeTitular,
            usuarioId: usuarioId 
        };

        try {
            // Chama a função da API. O interceptor (que editamos)
            // vai adicionar o token JWT automaticamente no cabeçalho.
            const response = await adicionarCartao(cartaoData);
            
            setMessage(`Cartão salvo com sucesso! ID: ${response.data.id}`);
            // Limpa o formulário
            setNumero('');
            setValidade('');
            setNomeTitular('');
            setUsuarioId('');

        } catch (error) {
            // Se o token estiver errado ou expirado, o backend retornará um erro 401 ou 403
            setMessage('Falha ao adicionar cartão. Você está logado?');
            console.error('Erro ao adicionar cartão:', error);
        }
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <p>Você está logado.</p>

            <hr />

            <h3>Adicionar Novo Cartão</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>ID do Usuário:</label>
                    <input
                        type="number"
                        value={usuarioId}
                        onChange={(e) => setUsuarioId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Número do Cartão:</label>
                    <input
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Validade (MM/AA):</label>
                    <input
                        type="text"
                        value={validade}
                        onChange={(e) => setValidade(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Nome no Cartão:</label>
                    <input
                        type="text"
                        value={nomeTitular}
                        onChange={(e) => setNomeTitular(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Adicionar Cartão</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default DashboardPage;
