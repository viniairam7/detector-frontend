import React, { useState, useEffect } from 'react';
import { getDadosSimulacao, addTransaction, confirmTransaction, denyTransaction } from '../api/api';

// ================== COMPONENTES VISUAIS (MODAIS) ==================

// 1. Modal de Decisão (Fraude Detectada)
const FraudActionModal = ({ transaction, onConfirm, onDeny }) => (
    <div style={modalOverlayStyle}>
        <div style={{...modalBoxStyle, border: '3px solid #d9534f'}}>
            <h2 style={{color: '#d9534f'}}>⚠️ ALERTA DE SISTEMA</h2>
            <p style={{fontSize: '1.2em'}}>{transaction.message}</p>
            <p><strong>Valor: R$ {transaction.valor.toFixed(2)}</strong></p>
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                <button onClick={onDeny} style={btnDenyStyle}>BLOQUEAR COMPRA</button>
                <button onClick={onConfirm} style={btnConfirmStyle}>AUTORIZAR COMPRA</button>
            </div>
        </div>
    </div>
);

// 2. Modal de Resultado (Substitui o Alert)
const ResultModal = ({ title, message, type, onClose }) => (
    <div style={modalOverlayStyle}>
        <div style={{...modalBoxStyle, border: `3px solid ${type === 'success' ? 'green' : 'red'}`}}>
            <h2 style={{color: type === 'success' ? 'green' : 'red'}}>{title}</h2>
            <p style={{fontSize: '1.1em'}}>{message}</p>
            <button onClick={onClose} style={btnCloseStyle}>Fechar</button>
        </div>
    </div>
);

// ================== PÁGINA PRINCIPAL ==================

const SimulacaoPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // ID do usuário selecionado
    const [selectedCard, setSelectedCard] = useState(null); // Objeto Cartão completo
    
    // Formulário
    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });

    // Controles de Modal
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [resultModal, setResultModal] = useState(null); // { title, message, type }

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const response = await getDadosSimulacao();
            setUsuarios(response.data);
        } catch (error) {
            console.error("Erro ao carregar dados de simulação", error);
        }
    };

    const handleSimular = async (e) => {
        e.preventDefault();
        setFormMessage({ text: 'Iniciando simulação...', type: 'loading' });

        try {
            // --- (A) Geocoding / Geolocation ---
            // (Reutilizando a lógica inteligente que criamos antes)
            const userPosition = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const latUser = userPosition.coords.latitude;
            const lonUser = userPosition.coords.longitude;

            // Geocoding da Loja (Nominatim)
            const query = encodeURIComponent(estabelecimento);
            // Bounding box de 10km
            const radius = 0.09;
            const viewbox = `${lonUser-radius},${latUser-radius},${lonUser+radius},${latUser+radius}`;
            
            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&viewbox=${viewbox}&bounded=1`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if(geoData.length === 0) {
                setFormMessage({ text: 'Local não encontrado próximo à maquina.', type: 'error' });
                return;
            }

            // --- (B) Enviar Transação ---
            const transacaoDto = {
                valor: parseFloat(valor),
                estabelecimento: estabelecimento,
                cartaoId: selectedCard.id,
                latitude: parseFloat(geoData[0].lat),
                longitude: parseFloat(geoData[0].lon),
                latitudeUsuario: latUser,
                longitudeUsuario: lonUser
            };

            const response = await addTransaction(transacaoDto);
            const resApi = response.data;

            if (resApi.statusResposta === 'COMPLETED') {
                setFormMessage({ text: '', type: '' });
                setResultModal({
                    title: '✅ APROVADA',
                    message: 'A transação passou por todas as regras de segurança.',
                    type: 'success'
                });
                // Limpar campos
                setValor(''); setEstabelecimento('');
            } else {
                setFormMessage({ text: '', type: '' });
                setPendingTransaction({
                    id: resApi.transacao.id,
                    message: resApi.mensagem,
                    valor: resApi.transacao.valor
                });
            }

        } catch (error) {
            setFormMessage({ text: 'Erro técnico na simulação: ' + error.message, type: 'error' });
        }
    };

    const handleDecision = async (decision) => {
        if (!pendingTransaction) return;
        try {
            if (decision === 'confirm') {
                await confirmTransaction(pendingTransaction.id);
                setResultModal({ title: '✅ AUTORIZADA', message: 'Você autorizou a transação manualmente.', type: 'success' });
            } else {
                await denyTransaction(pendingTransaction.id);
                setResultModal({ title: '⛔ BLOQUEADA', message: 'A transação foi negada com sucesso.', type: 'error' });
            }
        } catch (err) {
            setResultModal({ title: 'ERRO', message: 'Falha ao processar decisão.', type: 'error' });
        }
        setPendingTransaction(null);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{borderBottom: '2px solid #333', paddingBottom: '10px'}}>🛠️ Painel do Desenvolvedor (Simulação)</h1>
            
            {/* 1. LISTA DE USUÁRIOS */}
            <div style={{display: 'flex', gap: '20px', marginTop: '20px'}}>
                <div style={{flex: 1, background: '#f4f4f4', padding: '20px', borderRadius: '8px'}}>
                    <h3>1. Selecione um Usuário</h3>
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {usuarios.map(u => (
                            <li key={u.id} 
                                onClick={() => { setSelectedUser(u.id); setSelectedCard(null); }}
                                style={{
                                    padding: '10px', margin: '5px 0', cursor: 'pointer',
                                    background: selectedUser === u.id ? '#007bff' : 'white',
                                    color: selectedUser === u.id ? 'white' : 'black',
                                    borderRadius: '5px', border: '1px solid #ccc'
                                }}>
                                <strong>{u.nome}</strong> <br/> <small>{u.email}</small>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 2. LISTA DE CARTÕES (Só aparece se usuário selecionado) */}
                <div style={{flex: 1, background: '#f4f4f4', padding: '20px', borderRadius: '8px', opacity: selectedUser ? 1 : 0.5}}>
                    <h3>2. Selecione um Cartão</h3>
                    {selectedUser ? (
                        <ul style={{listStyle: 'none', padding: 0}}>
                            {usuarios.find(u => u.id === selectedUser)?.cartoes.map(c => (
                                <li key={c.id}
                                    onClick={() => setSelectedCard(c)}
                                    style={{
                                        padding: '10px', margin: '5px 0', cursor: 'pointer',
                                        background: selectedCard?.id === c.id ? '#28a745' : 'white',
                                        color: selectedCard?.id === c.id ? 'white' : 'black',
                                        borderRadius: '5px', border: '1px solid #ccc'
                                    }}>
                                    {c.bandeira} **** {c.numero.slice(-4)} <br/> <small>{c.nomeTitular}</small>
                                </li>
                            ))}
                        </ul>
                    ) : <p>Selecione um usuário primeiro.</p>}
                </div>
            </div>

            {/* 3. PAINEL DE SIMULAÇÃO (Só aparece se cartão selecionado) */}
            {selectedCard && (
                <div style={{marginTop: '30px', background: '#e3f2fd', padding: '30px', borderRadius: '10px', border: '2px solid #2196f3'}}>
                    <h2 style={{marginTop: 0, color: '#0d47a1'}}>3. Simular Compra no Bradesco</h2>
                    <p>Cartão: <strong>{selectedCard.bandeira} final {selectedCard.numero.slice(-4)}</strong> de <strong>{selectedCard.nomeTitular}</strong></p>
                    
                    <form onSubmit={handleSimular} style={{display: 'flex', gap: '15px', alignItems: 'flex-end'}}>
                        <div>
                            <label style={{display: 'block', marginBottom: '5px'}}>Valor (R$)</label>
                            <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} style={inputStyle} required />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', marginBottom: '5px'}}>Local (Nome do Estabelecimento)</label>
                            <input type="text" value={estabelecimento} onChange={e => setEstabelecimento(e.target.value)} style={{...inputStyle, width: '100%'}} required />
                        </div>
                        <button type="submit" disabled={formMessage.type === 'loading'} style={btnSimularStyle}>
                            {formMessage.type === 'loading' ? 'Processando...' : 'ENVIAR COMPRA'}
                        </button>
                    </form>
                    {formMessage.text && <p style={{color: formMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold'}}>{formMessage.text}</p>}
                </div>
            )}

            {/* MODAIS */}
            {pendingTransaction && (
                <FraudActionModal 
                    transaction={pendingTransaction} 
                    onConfirm={() => handleDecision('confirm')} 
                    onDeny={() => handleDecision('deny')} 
                />
            )}
            
            {resultModal && (
                <ResultModal 
                    title={resultModal.title} 
                    message={resultModal.message} 
                    type={resultModal.type} 
                    onClose={() => setResultModal(null)} 
                />
            )}

        </div>
    );
};

// --- ESTILOS CSS (Inline para facilitar a cópia, mas idealmente iriam para .css) ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalBoxStyle = { background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' };
const btnSimularStyle = { padding: '12px 25px', background: '#0d47a1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const btnConfirmStyle = { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnDenyStyle = { padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnCloseStyle = { marginTop: '20px', padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default SimulacaoPage;