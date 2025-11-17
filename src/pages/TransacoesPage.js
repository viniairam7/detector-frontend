import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    getTransacoesDoCartao, 
    addTransaction, 
    confirmTransaction, 
    denyTransaction 
} from '../api/api';

// --- (Componente Modal de Confirmação - TRADUZIDO) ---
const ConfirmationModal = ({ transaction, onConfirm, onDeny }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '25px', borderRadius: '8px',
                maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ color: '#d9534f', marginTop: 0 }}>⚠️ ALERTA DE FRAUDE!</h3>
                <p style={{ fontSize: '1.1em' }}>{transaction.message}</p>
                <p style={{ fontWeight: 'bold' }}>
                    Deseja confirmar esta transação mesmo assim?
                </p>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button 
                        onClick={onDeny} 
                        style={{ padding: '10px 20px', cursor: 'pointer', background: '#5bc0de', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Não (Negar)
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={{ padding: '10px 20px', cursor: 'pointer', background: '#d9534f', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        Sim (Confirmar)
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- (Página Principal de Transações - com alterações) ---
const TransacoesPage = () => {
    const [transacoes, setTransacoes] = useState([]);
    const [message, setMessage] = useState('Carregando extrato...');
    const { cartaoId } = useParams();

    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    const [pendingTransaction, setPendingTransaction] = useState(null);

    // --- (MUDANÇA 1: Função para traduzir status) ---
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

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- (TRADUZIDO) ---
        setFormMessage({ text: 'Processando...', type: 'loading' });

        if (!valor || !estabelecimento) {
            setFormMessage({ text: 'Valor e Estabelecimento são obrigatórios.', type: 'error' });
            return;
        }

        try {
            // --- (TRADUZIDO) ---
            setFormMessage({ text: 'Localizando estabelecimento...', type: 'loading' });
            
            const query = encodeURIComponent(estabelecimento);
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.length === 0) {
                // --- (TRADUZIDO) ---
                setFormMessage({ text: 'Não foi possível encontrar o endereço. Tente ser mais específico (ex: "Shopping Morumbi, São Paulo").', type: 'error' });
                return;
            }

            const latitudeLoja = parseFloat(geocodeData[0].lat);
            const longitudeLoja = parseFloat(geocodeData[0].lon);

            // --- (TRADUZIDO) ---
            setFormMessage({ text: 'Obtendo sua localização...', type: 'loading' });
            
            const userPosition = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error("Geolocalização não é suportada pelo seu navegador."));
                }
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const latitudeUsuario = userPosition.coords.latitude;
            const longitudeUsuario = userPosition.coords.longitude;

            // --- (TRADUZIDO) ---
            setFormMessage({ text: 'Enviando transação...', type: 'loading' });

            const transacaoDto = {
                valor: parseFloat(valor),
                estabelecimento,
                cartaoId: parseInt(cartaoId),
                latitude: latitudeLoja,
                longitude: longitudeLoja,
                latitudeUsuario: latitudeUsuario,
                longitudeUsuario: longitudeUsuario
            };

            const response = await addTransaction(transacaoDto);
            const respostaApi = response.data; 

            if (respostaApi.statusResposta === 'COMPLETED') {
                // --- (TRADUZIDO) ---
                setFormMessage({ text: 'Transação registrada com sucesso!', type: 'success' });
                fetchTransacoes(); 
                setValor('');
                setEstabelecimento('');
            } else if (respostaApi.statusResposta === 'PENDING_CONFIRMATION') {
                setFormMessage({ text: '', type: '' });
                setPendingTransaction({
                    id: respostaApi.transacao.id,
                    message: respostaApi.mensagem
                });
            }

        } catch (error) {
            console.error("Erro no processo de transação:", error);
            // --- (TRADUZIDO) ---
            setFormMessage({ text: `Erro: ${error.message}. Tente novamente.`, type: 'error' });
        }
    };
    
    // --- (MUDANÇA 2: Handlers refatorados para aceitar ID) ---
    // Agora podem ser chamados pelo Modal ou pela Lista
    const handleConfirm = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await confirmTransaction(transacaoId);
            // --- (TRADUZIDO) ---
            alert('Transação confirmada com sucesso!');
            // Se o modal estiver aberto para esta transação, feche-o
            if (pendingTransaction && pendingTransaction.id === transacaoId) {
                setPendingTransaction(null);
            }
            fetchTransacoes(); // Atualiza a lista
        } catch (error) {
            console.error("Erro ao confirmar transação:", error);
            alert("Erro ao confirmar.");
        }
    };

    const handleDeny = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await denyTransaction(transacaoId);
            // --- (TRADUZIDO) ---
            alert('Transação negada.');
            // Se o modal estiver aberto para esta transação, feche-o
            if (pendingTransaction && pendingTransaction.id === transacaoId) {
                setPendingTransaction(null);
            }
            fetchTransacoes(); // Atualiza a lista
        } catch (error) {
            console.error("Erro ao negar transação:", error);
            alert("Erro ao negar.");
        }
    };

    // Função de Estilo - (sem alterações)
    const getRowStyle = (status) => {
        if (status === 'PENDING') return { backgroundColor: '#fcf8e3' }; // Amarelo
        if (status === 'DENIED') return { backgroundColor: '#f2dede', textDecoration: 'line-through' }; // Vermelho
        return {}; // Padrão (APROVADA)
    };

    const getFormMessageStyle = () => {
        if (formMessage.type === 'error') return { color: 'red', marginTop: '10px', fontWeight: 'bold' };
        if (formMessage.type === 'success') return { color: 'green', marginTop: '10px', fontWeight: 'bold' };
        return { color: 'blue', marginTop: '10px', fontWeight: 'bold' };
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            
            {/* Modal agora chama os handlers com o ID */}
            {pendingTransaction && (
                <ConfirmationModal 
                    transaction={pendingTransaction}
                    onConfirm={() => handleConfirm(pendingTransaction.id)}
                    onDeny={() => handleDeny(pendingTransaction.id)}
                />
            )}

            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            
            <div style={{ 
                background: '#f9f9f9', padding: '20px', borderRadius: '8px', 
                marginTop: '20px', border: '1px solid #ddd' 
            }}>
                {/* --- (Formulário TRADUZIDO) --- */}
                <h3 style={{ marginTop: 0 }}>Registrar Nova Transação</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Valor (ex: 50.00)" 
                            value={valor} 
                            onChange={e => setValor(e.target.value)} 
                            style={{ padding: '8px', marginRight: '10px', width: '150px' }} 
                        />
                        <input 
                            type="text" 
                            placeholder="Estabelecimento (ex: Shopping Morumbi, São Paulo)" 
                            value={estabelecimento} 
                            onChange={e => setEstabelecimento(e.target.value)} 
                            style={{ padding: '8px', width: 'calc(100% - 180px)' }} 
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={formMessage.type === 'loading'}
                        style={{ 
                            padding: '10px 15px', 
                            cursor: formMessage.type === 'loading' ? 'not-allowed' : 'pointer', 
                            background: formMessage.type === 'loading' ? '#adb5bd' : '#0275d8', 
                            color: 'white', border: 'none', borderRadius: '5px' 
                        }}
                    >
                        {formMessage.type === 'loading' ? 'Processando...' : 'Registrar Transação'}
                    </button>
                    {formMessage.text && (
                        <p style={getFormMessageStyle()}>
                            {formMessage.text}
                        </p>
                    )}
                </form>
            </div>

            {/* --- (Tabela de Extrato TRADUZIDA e com AÇÕES) --- */}
            <h2 style={{ marginTop: '30px' }}>Extrato do Cartão (ID: {cartaoId})</h2>
            {message && <p>{message}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data/Hora</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estabelecimento</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor (R$)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                        {/* --- (MUDANÇA 3: Nova coluna de Ações) --- */}
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
                                {traduzirStatus(t.status)} {/* <-- Traduzido */}
                            </td>
                            
                            {/* --- (MUDANÇA 4: Botões condicionais) --- */}
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
                                    '--' // Sem ações para status APROVADA ou NEGADA
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