import React, { useState, useEffect } from 'react';
import { getDadosSimulacao, addTransaction } from '../api/api';

// Modal de Resultado Informativo (Apenas Info, sem Ações)
const ResultModal = ({ title, message, type, onClose }) => (
    <div style={modalOverlayStyle}>
        <div style={{...modalBoxStyle, border: `3px solid ${type === 'success' ? 'green' : '#f0ad4e'}`}}>
            <h2 style={{color: type === 'success' ? 'green' : '#f0ad4e'}}>{title}</h2>
            <p style={{fontSize: '1.1em'}}>{message}</p>
            <button onClick={onClose} style={btnCloseStyle}>Fechar</button>
        </div>
    </div>
);

const SimulacaoPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    
    const [valor, setValor] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });

    const [resultModal, setResultModal] = useState(null); 

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
            // --- (A) Geolocation do DEV (Simulando onde a "maquina" está) ---
            const userPosition = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const latDev = userPosition.coords.latitude;
            const lonDev = userPosition.coords.longitude;

            // --- (B) Geocoding da Loja (Nominatim) ---
            const query = encodeURIComponent(estabelecimento);
            // Bounding box de 10km ao redor do Dev
            const radius = 0.09;
            const viewbox = `${lonDev-radius},${latDev-radius},${lonDev+radius},${latDev+radius}`;
            
            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&viewbox=${viewbox}&bounded=1`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if(geoData.length === 0) {
                setFormMessage({ text: 'Local não encontrado próximo à sua localização atual (Dev).', type: 'error' });
                return;
            }

            // --- (C) Enviar Transação Simulada ---
            // Nota: Estamos enviando a lat/lon do usuário como a do DEV.
            // Em um teste real de fraude de localização, você pode "mentir" aqui
            // ou usar um VPN para alterar sua localização física.
            const transacaoDto = {
                valor: parseFloat(valor),
                estabelecimento: estabelecimento,
                cartaoId: selectedCard.id,
                latitude: parseFloat(geoData[0].lat), // Loja
                longitude: parseFloat(geoData[0].lon), // Loja
                latitudeUsuario: latDev, // Usuário (neste caso, o Dev simulando)
                longitudeUsuario: lonDev // Usuário
            };

            const response = await addTransaction(transacaoDto);
            const resApi = response.data;

            if (resApi.statusResposta === 'COMPLETED') {
                setFormMessage({ text: '', type: '' });
                setResultModal({
                    title: '✅ APROVADA DIRETO',
                    message: 'A transação passou pelas regras. O cliente verá a compra aprovada no extrato.',
                    type: 'success'
                });
                setValor(''); setEstabelecimento('');
            } else if (resApi.statusResposta === 'PENDING_CONFIRMATION') {
                // MUDANÇA CRÍTICA: Apenas avisa que o alerta foi enviado ao cliente
                setFormMessage({ text: '', type: '' });
                setResultModal({
                    title: '⚠️ RETIDA / ENVIADA AO CLIENTE',
                    message: `A transação foi considerada suspeita (${resApi.mensagem}). Um alerta pop-up foi enviado para o dashboard do cliente ${usuarios.find(u => u.id === selectedUser)?.nome} para confirmação.`,
                    type: 'warning'
                });
            }

        } catch (error) {
            setFormMessage({ text: 'Erro técnico na simulação: ' + error.message, type: 'error' });
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{borderBottom: '2px solid #333', paddingBottom: '10px'}}>🛠️ Painel do Desenvolvedor (Simulação)</h1>
            
            {/* LISTA DE USUÁRIOS */}
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

                {/* LISTA DE CARTÕES */}
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

            {/* PAINEL DE SIMULAÇÃO */}
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
                            {formMessage.type === 'loading' ? 'Enviando...' : 'ENVIAR COMPRA'}
                        </button>
                    </form>
                    {formMessage.text && <p style={{color: formMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold'}}>{formMessage.text}</p>}
                </div>
            )}

            {/* MODAL DE RESULTADO APENAS (SEM AÇÕES) */}
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

// Estilos CSS Inline
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalBoxStyle = { background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' };
const btnSimularStyle = { padding: '12px 25px', background: '#0d47a1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const btnCloseStyle = { marginTop: '20px', padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default SimulacaoPage;