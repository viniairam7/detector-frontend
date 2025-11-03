import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTransacoesDoCartao } from '../api/api';

const TransacoesPage = () => {
    const [transacoes, setTransacoes] = useState([]);
    const [message, setMessage] = useState('Carregando extrato...');
    const { cartaoId } = useParams(); // Pega o 'cartaoId' da URL

    useEffect(() => {
        const fetchTransacoes = async () => {
            if (!cartaoId) return;
            try {
                const response = await getTransacoesDoCartao(cartaoId);
                setTransacoes(response.data);
                if (response.data.length === 0) {
                    setMessage('Nenhuma transação encontrada para este cartão.');
                } else {
                    setMessage('');
                }
            } catch (error) {
                console.error('Erro ao buscar transações:', error);
                setMessage('Erro ao buscar transações.');
            }
        };

        fetchTransacoes();
    }, [cartaoId]); // Roda sempre que o cartaoId mudar

    return (
        <div>
            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            <h2 style={{ marginTop: '20px' }}>Extrato do Cartão (ID: {cartaoId})</h2>

            {message && <p>{message}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data/Hora</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estabelecimento</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    {transacoes.map(t => (
                        <tr key={t.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {new Date(t.dataHora).toLocaleString('pt-BR')}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {t.estabelecimento}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {t.valor.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Futuramente, você pode adicionar um formulário para registrar
                uma nova transação aqui também */}
        </div>
    );
};

export default TransacoesPage;
