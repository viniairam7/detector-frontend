import React, { useState, useEffect } from 'react';
import { getCards, addCard } from '../api/api';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    // --- NOVOS ESTADOS PARA OS NOVOS CAMPOS ---
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [nomeTitular, setNomeTitular] = useState('');
    const [localizacao, setLocalizacao] = useState(''); // Novo
    const [gastoPadrao, setGastoPadrao] = useState(''); // Novo
    // --- FIM DOS NOVOS ESTADOS ---

    const [formMessage, setFormMessage] = useState('');
    const [cartoes, setCartoes] = useState([]);
    const [listMessage, setListMessage] = useState('Carregando cartões...');

    const fetchCartoes = async () => {
        try {
            const response = await getCards();
            setCartoes(response.data);
            setListMessage(response.data.length === 0 ? 'Você ainda não tem cartões cadastrados.' : '');
        } catch (error) {
            console.error('Erro ao buscar cartões:', error);
            setListMessage('Erro ao buscar cartões.');
        }
    };

    useEffect(() => {
        fetchCartoes();
    }, []);

    const handleAddCartao = async (event) => {
        event.preventDefault();
        setFormMessage('');

        // --- ATUALIZAÇÃO DO OBJETO DE DADOS ---
        const cartaoData = {
            numero,
            validade,
            nomeTitular,
            localizacaoPadrao: localizacao, // Novo
            gastoPadraoMensal: gastoPadrao ? parseFloat(gastoPadrao) : null // Novo
        };
        // --- FIM DA ATUALIZAÇÃO ---

        try {
            await addCard(cartaoData);
            setFormMessage('Cartão adicionado com sucesso!');
            // Limpa o formulário
            setNumero('');
            setValidade('');
            setNomeTitular('');
            setLocalizacao(''); // Novo
            setGastoPadrao(''); // Novo
            
            fetchCartoes(); // Atualiza a lista
        } catch (error) {
            setFormMessage('Erro ao adicionar cartão.');
            console.error('Erro ao adicionar cartão:', error);
        }
    };

    return (
        <div>
            <h2>Seus Cartões</h2>
            {listMessage && <p>{listMessage}</p>}
            {/* Aplica o estilo de item de lista do App.css */}
            <ul style={{ padding: 0 }}> 
                {cartoes.map(cartao => (
                    <li key={cartao.id} className="list-item">
                        <strong>{cartao.nomeTitular}</strong>
                        {/* Mostra o número do cartão formatado e a validade */}
                        <p>Final: **** **** **** {cartao.numero.slice(-4)} | Validade: {cartao.validade}</p>
                        
                        {/* --- EXIBIÇÃO DOS NOVOS CAMPOS (se existirem) --- */}
                        {cartao.localizacaoPadrao && (
                            <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '5px' }}>
                                Local Padrão: {cartao.localizacaoPadrao}
                            </p>
                        )}
                        {cartao.gastoPadraoMensal && (
                            <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '5px' }}>
                                Gasto Padrão: R$ {cartao.gastoPadraoMensal.toFixed(2)}
                            </p>
                        )}
                        {/* --- FIM DA EXIBIÇÃO --- */}
                        
                        <Link to={`/cartao/${cartao.id}/transacoes`}>
                            Ver Extrato
                        </Link>
                    </li>
                ))}
            </ul>

            <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid var(--border-color)' }} />

            {/* Aplica os estilos de formulário do App.css */}
            <div className="form-card"> 
                <h3>Adicionar Novo Cartão</h3>
                <form onSubmit={handleAddCartao}>
                    {/* Campos antigos */}
                    <div className="form-group">
                        <label>Número do Cartão:</label>
                        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} required className="input-field" />
                    </div>
                    <div className="form-group">
                        <label>Validade (MM/AA):</label>
                        <input type="text" value={validade} onChange={(e) => setValidade(e.target.value)} required className="input-field" />
                    </div>
                    <div className="form-group">
                        <label>Nome no Cartão:</label>
                        <input type="text" value={nomeTitular} onChange={(e) => setNomeTitular(e.target.value)} required className="input-field" />
                    </div>

                    {/* --- NOVOS CAMPOS NO FORMULÁRIO --- */}
                    <div className="form-group">
                        <label>Localização Padrão (Cidade, UF):</label>
                        <input 
                            type="text" 
                            value={localizacao} 
                            onChange={(e) => setLocalizacao(e.target.value)} 
                            className="input-field"
                            placeholder="Ex: São Paulo, SP" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Gasto Padrão Mensal (R$):</label>
                        <input 
                            type="number"
                            step="0.01" // Permite casas decimais
                            value={gastoPadrao} 
                            onChange={(e) => setGastoPadrao(e.target.value)} 
                            className="input-field"
                            placeholder="Ex: 1500.00"
                        />
                    </div>
                    {/* --- FIM DOS NOVOS CAMPOS --- */}

                    <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                        Adicionar Cartão
                    </button>
                    {formMessage && <p className={`message ${formMessage.includes('sucesso') ? 'success' : 'error'}`}>{formMessage}</p>}
                </form>
            </div>
        </div>
    );
};

export default DashboardPage;
