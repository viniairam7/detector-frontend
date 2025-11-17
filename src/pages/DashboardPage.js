import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 1. IMPORTAÇÕES CORRIGIDAS E ADICIONADAS
import { getCards, addCard, setHorarioHabitual } from '../api/api';

const DashboardPage = () => {
    const [cartoes, setCartoes] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Mensagem de sucesso para adição de cartão
    const navigate = useNavigate();

    // States para o formulário de NOVO CARTÃO
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');

    // --- 2. NOVOS STATES PARA O FORMULÁRIO DE HORÁRIO ---
    const [horarioInicio, setHorarioInicio] = useState('08:00');
    const [horarioFim, setHorarioFim] = useState('22:00');
    const [horarioMessage, setHorarioMessage] = useState({ text: '', type: '' });

    // Busca os cartões quando a página carrega
    useEffect(() => {
        const fetchCards = async () => {
            try {
                // 3. NOME DA FUNÇÃO CORRIGIDO
                const response = await getCards(); 
                setCartoes(response.data);
            } catch (err) {
                console.error('Erro ao buscar cartões:', err);
                setError('Não foi possível carregar seus cartões. Faça login novamente.');
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
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
            // 4. NOME DA FUNÇÃO CORRIGIDO
            await addCard({ numero, validade, nomeTitular });
            
            // Limpa o formulário e exibe sucesso
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
            // Pega a mensagem de erro específica do backend (ex: "Número de cartão inválido")
            const errorMsg = err.response && err.response.data 
                           ? err.response.data.message || err.response.data 
                           : 'Verifique os dados.';
            setError(`Erro ao adicionar cartão: ${errorMsg}`);
            setMessage('');
        }
    };

    // --- 5. NOVA FUNÇÃO HANDLER PARA O HORÁRIO ---
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
    
    // Função para definir a cor da mensagem de horário
    const getHorarioMessageStyle = () => {
        if (horarioMessage.type === 'error') return { color: 'red' };
        if (horarioMessage.type === 'success') return { color: 'green' };
        if (horarioMessage.type === 'loading') return { color: 'blue' };
        return {};
    };

    return (
        <div style={{ maxWidth: '800px', margin: 'auto' }}>
            <h2>Dashboard</h2>
            
            {/* Formulário de Adicionar Cartão */}
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0 }}>Adicionar Novo Cartão</h3>
                <form onSubmit={handleAddCartao}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Número do Cartão (ex: 4242...)"
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            required
                            style={{ padding: '8px', marginRight: '10px', width: 'calc(60% - 15px)' }}
                        />
                        <input
                            type="text"
                            placeholder="Validade (MM/AA)"
                            value={validade}
                            onChange={e => setValidade(e.target.value)}
                            required
                            style={{ padding: '8px', width: 'calc(40% - 15px)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Nome (como está no cartão)"
                            value={nomeTitular}
                            onChange={e => setNomeTitular(e.target.value)}
                            required
                            style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer' }}>
                        Adicionar Cartão
                    </button>
                    {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                </form>
            </div>

            {/* --- 6. NOVO FORMULÁRIO DE HORÁRIO ADICIONADO AQUI --- */}
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginTop: '30px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0 }}>Definir Horário Habitual</h3>
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    Defina a janela de horário em que você costuma fazer compras. 
                    Transações fora deste período exigirão confirmação.
                </p>
                <form onSubmit={handleHorarioSubmit}>
                    <label>De:</label>
                    <input 
                        type="time" 
                        value={horarioInicio}
                        onChange={(e) => setHorarioInicio(e.target.value)}
                        style={{ margin: '0 10px', padding: '5px' }}
                        required
                    />
                    <label>Até:</label>
                    <input 
                        type="time" 
                        value={horarioFim}
                        onChange={(e) => setHorarioFim(e.target.value)}
                        style={{ marginLeft: '10px', padding: '5px' }}
                        required
                    />
                    <button type="submit" style={{ marginLeft: '15px', padding: '8px 12px', cursor: 'pointer' }}>
                        Salvar Horário
                    </button>
                    {horarioMessage.text && (
                        <p style={{ ...getHorarioMessageStyle(), marginTop: '10px', fontWeight: 'bold' }}>
                            {horarioMessage.text}
                        </p>
                    )}
                </form>
            </div>
            {/* --- FIM DO NOVO FORMULÁRIO --- */}

            {/* Lista de Cartões Cadastrados */}
            <h2 style={{ marginTop: '30px' }}>Meus Cartões</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div className="cartoes-lista">
                {cartoes.length > 0 ? (
                    cartoes.map(cartao => (
                        <div key={cartao.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>Final: **** {cartao.numero.slice(-4)}</p>
                            <p style={{ margin: '5px 0' }}>Titular: {cartao.nomeTitular}</p>
                            <p style={{ margin: '5px 0' }}>Bandeira: {cartao.bandeira}</p>
                            <Link to={`/cartao/${cartao.id}/transacoes`} style={{ textDecoration: 'none', color: '#007bff' }}>
                                Ver Extrato
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>{!error ? 'Nenhum cartão cadastrado.' : ''}</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;