import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    getTransacoesDoCartao, 
    addTransaction, 
    confirmTransaction, 
    denyTransaction 
} from '../api/api';

// --- (Componente Modal de Confirmação - sem alterações) ---
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

    // --- (MUDANÇA 1: Campos de lat/lon da loja removidos) ---
    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    const [pendingTransaction, setPendingTransaction] = useState(null);

    const fetchTransacoes = useCallback(async () => {
        // ... (lógica de busca existente, sem alterações)
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

    
    // --- (MUDANÇA 2: Lógica de handleSubmit totalmente automatizada) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMessage({ text: 'Processando...', type: 'loading' });

        if (!valor || !estabelecimento) {
            setFormMessage({ text: 'Valor e Estabelecimento são obrigatórios.', type: 'error' });
            return;
        }

        try {
            // --- (A) Geocoding da Loja (usando Nominatim) ---
            setFormMessage({ text: 'Localizando estabelecimento...', type: 'loading' });
            
            // Converte o nome do estabelecimento em URL (ex: "Shopping Morumbi" -> "Shopping%20Morumbi")
            const query = encodeURIComponent(estabelecimento);
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.length === 0) {
                setFormMessage({ text: 'Não foi possível encontrar o endereço do estabelecimento. Tente ser mais específico (ex: "Shopping Morumbi, São Paulo").', type: 'error' });
                return;
            }

            const latitudeLoja = parseFloat(geocodeData[0].lat);
            const longitudeLoja = parseFloat(geocodeData[0].lon);

            // --- (B) Geolocation do Usuário (usando Navegador) ---
            setFormMessage({ text: 'Obtendo sua localização...', type: 'loading' });
            
            // Oculta a permissão do navegador dentro de uma "Promise" para usar com async/await
            const userPosition = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error("Geolocalização não é suportada pelo seu navegador."));
                }
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const latitudeUsuario = userPosition.coords.latitude;
            const longitudeUsuario = userPosition.coords.longitude;

            // --- (C) Envio para o Backend ---
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
            const respostaApi = response.data; // O TransacaoResponseDTO

            if (respostaApi.statusResposta === 'COMPLETED') {
                setFormMessage({ text: 'Transação registrada com sucesso!', type: 'success' });
                fetchTransacoes(); // Atualiza a lista
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
            setFormMessage({ text: `Erro: ${error.message}. Tente novamente.`, type: 'error' });
        }
    };
    
    // --- (Handlers do Modal - sem alterações) ---
    const handleConfirm = async () => {
        if (!pendingTransaction) return;
        try {
            await confirmTransaction(pendingTransaction.id);
            alert('Transação confirmada com sucesso!');
            setPendingTransaction(null);
            fetchTransacoes();
        } catch (error) {
            console.error("Erro ao confirmar transação:", error);
            alert("Erro ao confirmar.");
        }
    };

    const handleDeny = async () => {
        if (!pendingTransaction) return;
        try {
            await denyTransaction(pendingTransaction.id);
            alert('Transação negada.');
            setPendingTransaction(null);
            fetchTransacoes();
        } catch (error) {
            console.error("Erro ao negar transação:", error);
            alert("Erro ao negar.");
        }
    };

    // --- (Função de Estilo - sem alterações) ---
    const getRowStyle = (status) => {
        if (status === 'PENDING') return { backgroundColor: '#fcf8e3' };
        if (status === 'DENIED') return { backgroundColor: '#f2dede', textDecoration: 'line-through' };
        return {};
    };

    // --- (MUDANÇA 3: Estilo da Mensagem do Formulário) ---
    const getFormMessageStyle = () => {
        if (formMessage.type === 'error') return { color: 'red', marginTop: '10px', fontWeight: 'bold' };
        if (formMessage.type === 'success') return { color: 'green', marginTop: '10px', fontWeight: 'bold' };
        return { color: 'blue', marginTop: '10px', fontWeight: 'bold' };
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            
            {pendingTransaction && (
                <ConfirmationModal 
                    transaction={pendingTransaction}
                    onConfirm={handleConfirm}
                    onDeny={handleDeny}
                />
            )}

            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            
            {/* --- (MUDANÇA 4: Formulário Simplificado) --- */}
            <div style={{ 
                background: '#f9f9f9', padding: '20px', borderRadius: '8px', 
                marginTop: '20px', border: '1px solid #ddd' 
            }}>
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
                    {/* Os inputs de lat/lon da loja foram removidos */}
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

            {/* --- (Tabela de Extrato - sem alterações) --- */}
            <h2 style={{ marginTop: '30px' }}>Extrato do Cartão (ID: {cartaoId})</h2>
            {message && <p>{message}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                {/* ... (cabeçalho da tabela) ... */}
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data/Hora</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estabelecimento</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Valor (R$)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
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
                                {t.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransacoesPage;