import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCards, addCard, setHorarioHabitual, updateLocation  } from '../api/api';

const DashboardPage = () => {
    const [cartoes, setCartoes] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // States para o formulário de NOVO CARTÃO
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');

    // States para o formulário de HORÁRIO
    const [horarioInicio, setHorarioInicio] = useState('08:00');
    const [horarioFim, setHorarioFim] = useState('22:00');
    const [horarioMessage, setHorarioMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        // Envia para o backend silenciosamente
                        await updateLocation(lat, lon);
                        console.log("Localização atualizada no servidor:", lat, lon);
                    } catch (error) {
                        console.error("Erro ao atualizar localização:", error);
                    }
                },
                (error) => console.error("Permissão de localização negada:", error)
            );
        }
    }, []);

    // Busca os cartões quando a página carrega
    useEffect(() => {
        const fetchCards = async () => {
            try {
                const response = await getCards();
                setCartoes(response.data);
            } catch (err) {
                console.error('Erro ao buscar cartões:', err);
                setError('Não foi possível carregar seus cartões. Faça login novamente.');
                // Se o erro for de autenticação, redireciona
                if (err.response && err.response.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchCards();
    }, [navigate]);

    // Handler para adicionar novo cartão
    const handleAddCartao = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('Adicionando cartão...');
        try {
            await addCard({ numero, validade, nomeTitular });
            
            setNumero('');
            setValidade('');
            setNomeTitular('');
            setMessage('Cartão adicionado com sucesso!');
            setError('');

            // Atualiza a lista de cartões
            const response = await getCards();
            setCartoes(response.data);

        } catch (err) {
            console.error('Erro ao adicionar cartão:', err);
            const errorMsg = err.response && err.response.data && err.response.data.message 
                           ? err.response.data.message 
                           : 'Verifique os dados.';
            setError(`Erro ao adicionar cartão: ${errorMsg}`);
            setMessage('');
        }
    };

    // Handler para salvar o horário habitual
    const handleHorarioSubmit = async (e) => {
        e.preventDefault();
        setHorarioMessage({ text: 'Salvando...', type: 'loading' });
        try {
            await setHorarioHabitual(horarioInicio, horarioFim);
            setHorarioMessage({ text: 'Horário salvo com sucesso!', type: 'success' });
        } catch (err) {
            console.error('Erro ao salvar horário:', err);
            setHorarioMessage({ text: 'Erro ao salvar. Tente novamente.', type: 'error' });
        }
    };
    
    const getHorarioMessageStyle = () => {
        if (horarioMessage.type === 'error') return { color: 'red' };
        if (horarioMessage.type === 'success') return { color: 'green' };
        if (horarioMessage.type === 'loading') return { color: 'blue' };
        return {};
    };

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Minha Conta (Dashboard)</h2>
            
            {/* CONFIGURAÇÃO DE HORÁRIO HABITUAL */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Definir Horário Habitual</h3>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                    Defina a janela de horário em que você costuma fazer compras. 
                    Transações fora deste período poderão ser sinalizadas para sua segurança.
                </p>
                <form onSubmit={handleHorarioSubmit} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <label style={{marginRight: '5px', fontWeight: 'bold'}}>De:</label>
                        <input 
                            type="time" 
                            value={horarioInicio}
                            onChange={(e) => setHorarioInicio(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            required
                        />
                    </div>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <label style={{marginRight: '5px', marginLeft: '10px', fontWeight: 'bold'}}>Até:</label>
                        <input 
                            type="time" 
                            value={horarioFim}
                            onChange={(e) => setHorarioFim(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            required
                        />
                    </div>
                    <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                        Salvar Preferência
                    </button>
                </form>
                {horarioMessage.text && (
                    <p style={{ ...getHorarioMessageStyle(), marginTop: '10px', fontWeight: 'bold' }}>
                        {horarioMessage.text}
                    </p>
                )}
            </div>

            {/* ADICIONAR NOVO CARTÃO */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '30px' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Adicionar Novo Cartão</h3>
                <form onSubmit={handleAddCartao}>
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Número do Cartão (ex: 4242...)"
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            required
                            style={{ padding: '10px', flex: 2, borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="text"
                            placeholder="Validade (MM/AA)"
                            value={validade}
                            onChange={e => setValidade(e.target.value)}
                            required
                            style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Nome do Titular (como no cartão)"
                            value={nomeTitular}
                            onChange={e => setNomeTitular(e.target.value)}
                            required
                            style={{ padding: '10px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                        Adicionar Cartão
                    </button>
                    {message && <p style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>{message}</p>}
                    {error && <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>{error}</p>}
                </form>
            </div>

            {/* LISTA DE CARTÕES */}
            <h3 style={{ marginTop: '40px', color: '#333' }}>Meus Cartões</h3>
            
            <div className="cartoes-lista">
                {cartoes.length > 0 ? (
                    cartoes.map(cartao => (
                        <div key={cartao.id} style={{ 
                            border: '1px solid #e0e0e0', padding: '20px', marginBottom: '15px', 
                            borderRadius: '8px', background: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontWeight: 'bold', fontSize: '1.1em', margin: '0 0 5px 0', color: '#333' }}>
                                    {cartao.bandeira} <span style={{color: '#666', fontSize: '0.9em'}}>•••• {cartao.numero.slice(-4)}</span>
                                </p>
                                <p style={{ margin: 0, color: '#777', fontSize: '0.9em' }}>{cartao.nomeTitular}</p>
                            </div>
                            <Link 
                                to={`/cartao/${cartao.id}/transacoes`} 
                                style={{ 
                                    textDecoration: 'none', color: '#007bff', fontWeight: 'bold',
                                    border: '1px solid #007bff', padding: '8px 12px', borderRadius: '4px'
                                }}
                            >
                                Ver Extrato
                            </Link>
                        </div>
                    ))
                ) : (
                    <p style={{color: '#666', fontStyle: 'italic'}}>Você ainda não possui cartões cadastrados.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;