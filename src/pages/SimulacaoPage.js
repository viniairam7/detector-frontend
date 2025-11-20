import React, { useState, useEffect } from 'react';
import { getDadosSimulacao, addTransaction } from '../api/api';

// =====================================================================
// COMPONENTE: MODAL DE RESULTADO (Apenas Informativo)
// =====================================================================
const ResultModal = ({ title, message, type, onClose }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
        <div style={{
            background: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '450px', textAlign: 'center',
            border: `3px solid ${type === 'success' ? '#28a745' : '#f0ad4e'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            <h2 style={{ color: type === 'success' ? '#28a745' : '#f0ad4e', marginTop: 0 }}>{title}</h2>
            <p style={{ fontSize: '1.1em', margin: '20px 0' }}>{message}</p>
            <button 
                onClick={onClose} 
                style={{
                    padding: '10px 20px', background: '#6c757d', color: 'white', 
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px'
                }}
            >
                Fechar
            </button>
        </div>
    </div>
);

// =====================================================================
// PÁGINA PRINCIPAL DE SIMULAÇÃO
// =====================================================================
const SimulacaoPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    
    // States do Formulário
    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });

    // State do Modal
    const [resultModal, setResultModal] = useState(null); 

    // Carrega os dados ao abrir a página
    useEffect(() => {
        const carregarDados = async () => {
            try {
                const response = await getDadosSimulacao();
                setUsuarios(response.data);
            } catch (error) {
                console.error("Erro ao carregar dados de simulação", error);
                setFormMessage({ text: 'Erro ao carregar lista de usuários. Verifique se você é Admin.', type: 'error' });
            }
        };
        carregarDados();
    }, []);

    const handleSimular = async (e) => {
        e.preventDefault();
        setFormMessage({ text: 'Processando simulação...', type: 'loading' });

        try {
            // 1. Geocoding da Loja (Nominatim)
            // Usamos uma busca global, pois o Dev pode simular uma compra em qualquer lugar do mundo
            const query = encodeURIComponent(estabelecimento);
            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
            
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if(geoData.length === 0) {
                setFormMessage({ text: 'Localização da loja não encontrada. Tente ser mais específico (ex: "Torre Eiffel, Paris").', type: 'error' });
                return;
            }

            // 2. Montar o Objeto de Transação
            const transacaoDto = {
                valor: parseFloat(valor),
                estabelecimento: estabelecimento,
                cartaoId: selectedCard.id,
                // Localização da LOJA (Geocodificada agora)
                latitude: parseFloat(geoData[0].lat),
                longitude: parseFloat(geoData[0].lon),
                
                // MÁGICA AQUI: Enviamos 0.0 para o usuário.
                // Isso avisa o Backend para usar a localização SALVA NO BANCO do cliente.
                latitudeUsuario: 0.0, 
                longitudeUsuario: 0.0 
            };

            // 3. Enviar para a API
            const response = await addTransaction(transacaoDto);
            const resApi = response.data;

            // 4. Analisar Resultado
            if (resApi.statusResposta === 'COMPLETED') {
                setFormMessage({ text: '', type: '' });
                setResultModal({
                    title: '✅ APROVADA AUTOMATICAMENTE',
                    message: 'A transação passou por todas as regras de segurança (Valor, Horário e Localização). O cliente verá a compra aprovada no extrato.',
                    type: 'success'
                });
                // Limpa o formulário
                setValor(''); setEstabelecimento('');
            } else if (resApi.statusResposta === 'PENDING_CONFIRMATION') {
                setFormMessage({ text: '', type: '' });
                
                // Encontra o nome do usuário para a mensagem
                const nomeUsuario = usuarios.find(u => u.id === selectedUser)?.nome || 'Cliente';
                
                setResultModal({
                    title: '⚠️ SUSPEITA DE FRAUDE DETECTADA',
                    message: `O sistema reteve a transação! Motivo: "${resApi.mensagem}". Um alerta pop-up foi enviado agora para o dashboard de ${nomeUsuario} solicitando confirmação.`,
                    type: 'warning'
                });
            }

        } catch (error) {
            console.error(error);
            setFormMessage({ text: 'Erro técnico na simulação. Verifique o console.', type: 'error' });
        }
    };

    // Estilos
    const containerStyle = { padding: '40px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' };
    const sectionStyle = { flex: 1, background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' };
    const listStyle = { listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' };
    const itemStyle = (isSelected) => ({
        padding: '12px', margin: '8px 0', cursor: 'pointer',
        background: isSelected ? '#007bff' : 'white',
        color: isSelected ? 'white' : '#333',
        borderRadius: '5px', border: '1px solid #ccc',
        transition: '0.2s'
    });

    return (
        <div style={containerStyle}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '15px', color: '#333' }}>
                🛠️ Painel do Desenvolvedor (Simulação de Transações)
            </h1>
            
            <div style={{ display: 'flex', gap: '30px', marginTop: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
                
                {/* 1. LISTA DE USUÁRIOS */}
                <div style={sectionStyle}>
                    <h3 style={{marginTop: 0, color: '#555'}}>1. Selecione um Usuário</h3>
                    <ul style={listStyle}>
                        {usuarios.map(u => (
                            <li key={u.id} 
                                onClick={() => { setSelectedUser(u.id); setSelectedCard(null); }}
                                style={itemStyle(selectedUser === u.id)}>
                                <strong>{u.nome}</strong><br/>
                                <small style={{ opacity: 0.8 }}>{u.email}</small>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 2. LISTA DE CARTÕES */}
                <div style={{...sectionStyle, opacity: selectedUser ? 1 : 0.5, pointerEvents: selectedUser ? 'auto' : 'none'}}>
                    <h3 style={{marginTop: 0, color: '#555'}}>2. Selecione um Cartão</h3>
                    {selectedUser ? (
                        <ul style={listStyle}>
                            {usuarios.find(u => u.id === selectedUser)?.cartoes.map(c => (
                                <li key={c.id}
                                    onClick={() => setSelectedCard(c)}
                                    style={itemStyle(selectedCard?.id === c.id)}>
                                    <strong>{c.bandeira}</strong> **** {c.numero.slice(-4)}<br/>
                                    <small style={{ opacity: 0.8 }}>{c.nomeTitular}</small>
                                </li>
                            ))}
                            {usuarios.find(u => u.id === selectedUser)?.cartoes.length === 0 && <p>Este usuário não tem cartões.</p>}
                        </ul>
                    ) : <p style={{color: '#888'}}>Selecione um usuário para ver os cartões.</p>}
                </div>
            </div>

            {/* 3. PAINEL DE SIMULAÇÃO */}
            {selectedCard && (
                <div style={{ marginTop: '40px', background: '#e3f2fd', padding: '30px', borderRadius: '10px', border: '2px solid #2196f3' }}>
                    <h2 style={{ marginTop: 0, color: '#0d47a1', borderBottom: '1px solid #90caf9', paddingBottom: '10px' }}>
                        3. Simular Compra no Bradesco
                    </h2>
                    <p style={{ fontSize: '1.1em' }}>
                        Simulando compra no cartão <strong>{selectedCard.bandeira} final {selectedCard.numero.slice(-4)}</strong>
                    </p>
                    
                    <form onSubmit={handleSimular} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{flex: 1, minWidth: '150px'}}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0d47a1' }}>Valor (R$)</label>
                            <input 
                                type="number" step="0.01" 
                                value={valor} onChange={e => setValor(e.target.value)} 
                                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} 
                                required 
                            />
                        </div>
                        <div style={{flex: 3, minWidth: '250px'}}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0d47a1' }}>Local da Compra (Cidade/Loja)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Apple Store, New York"
                                value={estabelecimento} onChange={e => setEstabelecimento(e.target.value)} 
                                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} 
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={formMessage.type === 'loading'}
                            style={{ 
                                padding: '12px 30px', background: '#0d47a1', color: 'white', 
                                border: 'none', borderRadius: '5px', cursor: 'pointer', 
                                fontWeight: 'bold', fontSize: '16px', height: '45px' 
                            }}
                        >
                            {formMessage.type === 'loading' ? 'ENVIANDO...' : 'ENVIAR COMPRA'}
                        </button>
                    </form>

                    {formMessage.text && (
                        <div style={{ 
                            marginTop: '20px', padding: '15px', borderRadius: '5px',
                            background: formMessage.type === 'error' ? '#f8d7da' : '#cce5ff',
                            color: formMessage.type === 'error' ? '#721c24' : '#004085',
                            border: `1px solid ${formMessage.type === 'error' ? '#f5c6cb' : '#b8daff'}`
                        }}>
                            <strong>Status:</strong> {formMessage.text}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE RESULTADO */}
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

export default SimulacaoPage;