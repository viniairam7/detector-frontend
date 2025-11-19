// src/pages/TransacoesPage.js - Limpo
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTransacoesDoCartao, confirmTransaction, denyTransaction } from '../api/api';

// --- (Componente Modal de Confirmação - É BOM DEIXAR AQUI TAMBÉM SE VOCÊ QUISER REABRIR O MODAL POR UM BOTÃO NO EXTRATO) ---
// Mas para simplificar, vamos assumir que o modal só vive no Dashboard.

const TransacoesPage = () => {
    const [transacoes, setTransacoes] = useState([]);
    const [message, setMessage] = useState('Carregando extrato...');
    const { cartaoId } = useParams();

    // --- MUDANÇA: APENAS LÓGICA DE LISTAGEM ---
    
    // Função para traduzir status
    const traduzirStatus = (status) => {
        if (status === 'PENDING') return 'PENDENTE';
        if (status === 'COMPLETED') return 'APROVADA';
        if (status === 'DENIED') return 'NEGADA';
        return status;
    };

    const fetchTransacoes = useCallback(async () => {
        if (!cartaoId) return;
        setMessage('Atualizando extrato...');
        try {
            const response = await getTransacoesDoCartao(cartaoId);
            const transacoesOrdenadas = response.data.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
            setTransacoes(transacoesOrdenadas);
            setMessage(response.data.length === 0 ? 'Nenhuma transação encontrada.' : '');
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            setMessage('Erro ao buscar transações.');
        }
    }, [cartaoId]);

    useEffect(() => {
        fetchTransacoes();
    }, [fetchTransacoes]);

    // Handlers para os botões na tabela (necessários mesmo sem o modal)
    const handleConfirm = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await confirmTransaction(transacaoId);
            alert('Transação confirmada com sucesso!');
            fetchTransacoes();
        } catch (error) {
            alert("Erro ao confirmar.");
        }
    };

    const handleDeny = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await denyTransaction(transacaoId);
            alert('Transação negada.');
            fetchTransacoes();
        } catch (error) {
            alert("Erro ao negar.");
        }
    };

    const getRowStyle = (status) => {
        if (status === 'PENDING') return { backgroundColor: '#fcf8e3' };
        if (status === 'DENIED') return { backgroundColor: '#f2dede', textDecoration: 'line-through' };
        return {};
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            
            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            
            <h2 style={{ marginTop: '30px' }}>Extrato Detalhado (Simulação)</h2>
            <p>Este extrato se atualiza automaticamente após cada simulação ou confirmação.</p>
            {message && <p>{message}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data/Hora</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estabelecimento</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor (R$)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {transacoes.map(t => (
                        <tr key={t.id} style={getRowStyle(t.status)}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {new Date(t.dataHora).toLocaleString('pt-BR')}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {t.estabelecimento}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {t.valor.toFixed(2)}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                {traduzirStatus(t.status)}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                {t.status === 'PENDING' ? (
                                    <div style={{display: 'flex', justifyContent: 'center', gap: '5px'}}>
                                        <button 
                                            onClick={() => handleConfirm(t.id)} 
                                            style={{color: 'green', cursor: 'pointer', padding: '5px', border: '1px solid green', background: '#f0fff0'}}
                                        >
                                            Confirmar
                                        </button>
                                        <button 
                                            onClick={() => handleDeny(t.id)} 
                                            style={{color: 'red', cursor: 'pointer', padding: '5px', border: '1px solid red', background: '#fff0f0'}}
                                        >
                                            Negar
                                        </button>
                                    </div>
                                ) : (
                                    '--'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransacoesPage;