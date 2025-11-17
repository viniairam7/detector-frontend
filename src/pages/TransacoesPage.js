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

// --- (Página Principal de Transações) ---
const TransacoesPage = () => {
    const [transacoes, setTransacoes] = useState([]);
    const [message, setMessage] = useState('Carregando extrato...');
    const { cartaoId } = useParams();

    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    const [pendingTransaction, setPendingTransaction] = useState(null);

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

    
    // =====================================================================
    // (MUDANÇA AQUI) - Geocoding Frágil Corrigido
    // =====================================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMessage({ text: 'Processando...', type: 'loading' });

        if (!valor || !estabelecimento) {
            setFormMessage({ text: 'Valor e Estabelecimento são obrigatórios.', type: 'error' });
            return;
        }

        try {
            // --- (B) Geolocation do Usuário (VEM PRIMEIRO) ---
            setFormMessage({ text: 'Obtendo sua localização...', type: 'loading' });
            
            const userPosition = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error("Geolocalização não é suportada pelo seu navegador."));
                }
                // Timeout de 10 segundos
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });

            const latitudeUsuario = userPosition.coords.latitude;
            const longitudeUsuario = userPosition.coords.longitude;

            // --- (A) Geocoding da Loja (AGORA USA O CONTEXTO DO USUÁRIO) ---
            setFormMessage({ text: 'Localizando estabelecimento...', type: 'loading' });
            
            // Cria uma "caixa" (bounding box) de ~50km ao redor do usuário
            const radiusDeg = 0.09; // (Aprox 55.5 km)
            const viewbox = [
                longitudeUsuario - radiusDeg, // lon_min
                latitudeUsuario - radiusDeg,  // lat_min
                longitudeUsuario + radiusDeg, // lon_max
                latitudeUsuario + radiusDeg   // lat_max
            ].join(',');
            
            const query = encodeURIComponent(estabelecimento);
            // Adiciona &viewbox=${viewbox}&bounded=1 para a API Nominatim
            // bounded=1 força os resultados a estarem *dentro* da caixa
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&viewbox=${viewbox}&bounded=1`;

            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.length === 0) {
                // Se não achar NADA perto, tenta uma busca global (sem a caixa)
                // como um fallback, antes de desistir.
                const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
                const fallbackResponse = await fetch(fallbackUrl);
                const fallbackData = await fallbackResponse.json();

                if(fallbackData.length === 0) {
                    setFormMessage({ text: 'Não foi possível encontrar o endereço. Tente ser mais específico (ex: "Shopping Morumbi, São Paulo").', type: 'error' });
                    return;
                }
                geocodeData[0] = fallbackData[0];
            }

            const latitudeLoja = parseFloat(geocodeData[0].lat);
            const longitudeLoja = parseFloat(geocodeData[0].lon);


            // --- (C) Envio para o Backend (Sem alteração) ---
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
            // Tratamento de erro melhorado para timeout de geolocalização
            let errorMsg = error.message;
            if (error.code === 1) errorMsg = "Permissão de localização negada.";
            if (error.code === 3) errorMsg = "Tempo limite para obter localização esgotado.";
            
            setFormMessage({ text: `Erro: ${errorMsg}. Tente novamente.`, type: 'error' });
        }
    };
    
    // --- (Handlers do Modal - refatorados para aceitar ID) ---
    const handleConfirm = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await confirmTransaction(transacaoId);
            alert('Transação confirmada com sucesso!');
            if (pendingTransaction && pendingTransaction.id === transacaoId) {
                setPendingTransaction(null);
            }
            fetchTransacoes(); 
        } catch (error) {
            console.error("Erro ao confirmar transação:", error);
            alert("Erro ao confirmar.");
        }
    };

    const handleDeny = async (transacaoId) => {
        if (!transacaoId) return;
        try {
            await denyTransaction(transacaoId);
            alert('Transação negada.');
            if (pendingTransaction && pendingTransaction.id === transacaoId) {
                setPendingTransaction(null);
            }
            fetchTransacoes(); 
        } catch (error) {
            console.error("Erro ao negar transação:", error);
            alert("Erro ao negar.");
        }
    };

    // --- (Funções de Estilo - sem alterações) ---
    const getRowStyle = (status) => {
        if (status === 'PENDING') return { backgroundColor: '#fcf8e3' }; 
        if (status === 'DENIED') return { backgroundColor: '#f2dede', textDecoration: 'line-through' }; 
        return {};
    };

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
                    onConfirm={() => handleConfirm(pendingTransaction.id)}
                    onDeny={() => handleDeny(pendingTransaction.id)}
                />
            )}

            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            
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

            <h2 style={{ marginTop: '30px' }}>Extrato do Cartão (ID: {cartaoId})</h2>
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