import React, { useState, useEffect } from 'react';
import { adicionarCartao, getMeusCartoes } from '../api/api';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    // Para o formulário de novo cartão
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');
    const [formMessage, setFormMessage] = useState('');
    
    // Para a lista de cartões
    const [cartoes, setCartoes] = useState([]);
    const [listMessage, setListMessage] = useState('Carregando cartões...');

    // Função para buscar os cartões do usuário
    const fetchCartoes = async () => {
        try {
            const response = await getMeusCartoes();
            setCartoes(response.data);
            if (response.data.length === 0) {
                setListMessage('Você ainda não tem cartões cadastrados.');
            } else {
                setListMessage('');
            }
        } catch (error) {
            console.error('Erro ao buscar cartões:', error);
            setListMessage('Erro ao buscar cartões.');
        }
    };

    // useEffect com [] vazia roda UMA VEZ quando a página carrega
    useEffect(() => {
        fetchCartoes();
    }, []);

    // Função para lidar com o envio do formulário de novo cartão
    const handleAddCartao = async (event) => {
        event.preventDefault();
        setFormMessage('');

        // O DTO não precisa mais do usuarioId!
        const cartaoData = { numero, validade, nomeTitular };

        try {
            await adicionarCartao(cartaoData);
            setFormMessage('Cartão adicionado com sucesso!');
            // Limpa o formulário
            setNumero('');
            setValidade('');
            setNomeTitular('');
            // Atualiza a lista de cartões
            fetchCartoes();
        } catch (error) {
            setFormMessage('Erro ao adicionar cartão.');
            console.error('Erro ao adicionar cartão:', error);
        }
    };

    return (
        <div>
            <h2>Seus Cartões</h2>
            {listMessage && <p>{listMessage}</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {cartoes.map(cartao => (
                    <li key={cartao.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                        <strong>{cartao.nomeTitular}</strong>
                        <p>Final: **** **** **** {cartao.numero.slice(-4)}</p>
                        <p>Validade: {cartao.validade}</p>
                        <Link to={`/cartao/${cartao.id}/transacoes`}>
                            Ver Extrato
                        </Link>
                    </li>
                ))}
            </ul>

            <hr style={{ margin: '30px 0' }} />

            <h2>Adicionar Novo Cartão</h2>
            <form onSubmit={handleAddCartao}>
                {/* O campo usuarioId foi REMOVIDO */}
                <div style={{ marginBottom: '10px' }}>
                    <label>Número do Cartão:</label>
                    <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} required style={{ marginLeft: '10px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Validade (MM/AA):</label>
                    <input type="text" value={validade} onChange={(e) => setValidade(e.target.value)} required style={{ marginLeft: '10px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Nome no Cartão:</label>
                    <input type="text" value={nomeTitular} onChange={(e) => setNomeTitular(e.target.value)} required style={{ marginLeft: '10px' }} />
                </div>
                <button type="submit">Adicionar Cartão</button>
            </form>
            {formMessage && <p>{formMessage}</p>}
        </div>
    );
};

export default DashboardPage;
