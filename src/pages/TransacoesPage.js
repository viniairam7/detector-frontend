// src/pages/TransacoesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
// 1. IMPORTAR AS NOVAS FUNÇÕES DA API
import { 
    getTransacoesDoCartao, 
    addTransaction, 
    confirmTransaction, 
    denyTransaction 
} from '../api/api';

// =====================================================================
// TAREFA 4: O "MODAL DE CONFIRMAÇÃO" (NOVO COMPONENTE)
// Eu o coloquei dentro do mesmo arquivo para facilitar.
// =====================================================================
const ConfirmationModal = ({ transaction, onConfirm, onDeny }) => {
    return (
        // O "fundo" escuro do modal
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            {/* A caixa branca do modal */}
            <div style={{
                background: 'white', padding: '25px', borderRadius: '8px',
                maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ color: '#d9534f', marginTop: 0 }}>⚠️ ALERTA DE FRAUDE!</h3>
                {/* A mensagem de alerta vinda do backend */}
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
// =====================================================================
// FIM DO COMPONENTE MODAL
// =====================================================================


// Sua página principal, agora com o formulário e a lógica do modal
const TransacoesPage = () => {
    const [transacoes, setTransacoes] = useState([]);
    const [message, setMessage] = useState('Carregando extrato...');
    const { cartaoId } = useParams();

    // States para o formulário
    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [latitudeLoja, setLatitudeLoja] = useState(''); // Lat da loja (manual)
    const [longitudeLoja, setLongitudeLoja] = useState(''); // Lon da loja (manual)
    const [formError, setFormError] = useState('');

    // **TAREFA 4 (continuação):** State que controla se o modal aparece
    const [pendingTransaction, setPendingTransaction] = useState(null); // null = escondido

    // Envolvemos em useCallback para reutilizar a função
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

    // Busca transações quando a página carrega
    useEffect(() => {
        fetchTransacoes();
    }, [fetchTransacoes]);


    // =====================================================================
    // TAREFA 3: LIDAR COM A NOVA RESPOSTA (TransacaoResponseDTO)
    // =====================================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!valor || !estabelecimento || !latitudeLoja || !longitudeLoja) {
            setFormError('Todos os campos são obrigatórios.');
            return;
        }

        // 1. Obter localização do usuário (PC ou Celular)
        if (!navigator.geolocation) {
            setFormError("Geolocalização não é suportada pelo seu navegador.");
            return;
        }

        // Exibe um "loading" enquanto pede a localização
        setFormError("Aguarde... Obtendo sua localização para segurança.");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // Sucesso ao obter localização
                const latitudeUsuario = position.coords.latitude;
                const longitudeUsuario = position.coords.longitude;
                setFormError(""); // Limpa o "loading"

                const transacaoDto = {
                    valor: parseFloat(valor),
                    estabelecimento,
                    cartaoId: parseInt(cartaoId),
                    latitude: parseFloat(latitudeLoja),
                    longitude: parseFloat(longitudeLoja),
                    latitudeUsuario: latitudeUsuario,
                    longitudeUsuario: longitudeUsuario
                };

                // 2. Chamar a API e tratar a RESPOSTA
                try {
                    const response = await addTransaction(transacaoDto);
                    const respostaApi = response.data; // Este é o TransacaoResponseDTO

                    // 3. Verificar o status interno da resposta
                    if (respostaApi.statusResposta === 'COMPLETED') {
                        // Caminho A: Aprovada direto!
                        alert(respostaApi.mensagem);
                        fetchTransacoes(); // Atualiza a lista
                        setValor('');
                        setEstabelecimento('');
                        setLatitudeLoja('');
                        setLongitudeLoja('');
                    } 
                    else if (respostaApi.statusResposta === 'PENDING_CONFIRMATION') {
                        // Caminho B: Fraude detectada! Ativa o Modal
                        setPendingTransaction({
                            id: respostaApi.transacao.id,
                            message: respostaApi.mensagem
                        });
                        // Não limpamos o formulário
                    }

                } catch (error) {
                    console.error("Erro no servidor ao registrar transação:", error);
                    setFormError("Erro inesperado no servidor. Tente novamente.");
                }
            },
            (error) => {
                // Erro ao obter localização
                console.error("Erro ao obter localização: ", error);
                setFormError("Permissão de localização é necessária para registrar a transação.");
            }
        );
    };

    // =====================================================================
    // Funções que a TAREFA 4 (Modal) vai chamar
    // =====================================================================
    const handleConfirm = async () => {
        if (!pendingTransaction) return;
        try {
            await confirmTransaction(pendingTransaction.id);
            alert('Transação confirmada com sucesso!');
            setPendingTransaction(null); // Fecha o modal
            fetchTransacoes(); // Atualiza a lista (status vai mudar para COMPLETED)
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
            setPendingTransaction(null); // Fecha o modal
            fetchTransacoes(); // Atualiza a lista (status vai mudar para DENIED)
        } catch (error) {
            console.error("Erro ao negar transação:", error);
            alert("Erro ao negar.");
        }
    };

    // Função de estilo para a tabela
    const getRowStyle = (status) => {
        if (status === 'PENDING') return { backgroundColor: '#fcf8e3' }; // Amarelo
        if (status === 'DENIED') return { backgroundColor: '#f2dede', textDecoration: 'line-through' }; // Vermelho
        return {}; // Padrão (COMPLETED)
    };


    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            
            {/* TAREFA 4 (Renderização): O Modal só aparece se 'pendingTransaction' não for null */}
            {pendingTransaction && (
                <ConfirmationModal 
                    transaction={pendingTransaction}
                    onConfirm={handleConfirm}
                    onDeny={handleDeny}
                />
            )}

            <Link to="/dashboard">{"< Voltar ao Dashboard"}</Link>
            
            {/* FORMULÁRIO DE NOVA TRANSAÇÃO */}
            <div style={{ 
                background: '#f9f9f9', padding: '20px', borderRadius: '8px', 
                marginTop: '20px', border: '1px solid #ddd' 
            }}>
                <h3 style={{ marginTop: 0 }}>Registrar Nova Transação</h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    (Para fins de teste, insira as coordenadas da loja manualmente. O App obterá sua localização atual automaticamente.)
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <input type="number" step="0.01" placeholder="Valor (ex: 50.00)" value={valor} onChange={e => setValor(e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
                        <input type="text" placeholder="Estabelecimento" value={estabelecimento} onChange={e => setEstabelecimento(e.target.value)} style={{ padding: '8px', width: 'calc(100% - 180px)' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input type="text" placeholder="Latitude da Loja (ex: -23.55)" value={latitudeLoja} onChange={e => setLatitudeLoja(e.target.value)} style={{ padding: '8px', marginRight: '10px', width: 'calc(50% - 10px)' }} />
                        <input type="text" placeholder="Longitude da Loja (ex: -46.63)" value={longitudeLoja} onChange={e => setLongitudeLoja(e.target.value)} style={{ padding: '8px', width: '50%' }} />
                    </div>
                    <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer', background: '#0275d8', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Registrar Transação
                    </button>
                    {formError && <p style={{ color: 'red', marginTop: '10px' }}>{formError}</p>}
                </form>
            </div>


            {/* Tabela de Extrato (Seu código original, agora com 'status') */}
            <h2 style={{ marginTop: '30px' }}>Extrato do Cartão (ID: {cartaoId})</h2>
            {message && <p>{message}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
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