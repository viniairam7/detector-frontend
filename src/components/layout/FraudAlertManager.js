import React, { useEffect, useState } from 'react';
import { verificarPendencias, confirmTransaction, denyTransaction } from '../../api/api';

// Reutilizamos o estilo do Modal aqui
const ConfirmationModal = ({ transaction, onConfirm, onDeny }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fundo mais escuro para chamar atenção
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '8px',
                maxWidth: '450px', width: '90%', textAlign: 'center', 
                border: '4px solid #d9534f', // Borda vermelha
                boxShadow: '0 0 20px rgba(217, 83, 79, 0.5)'
            }}>
                <h2 style={{ color: '#d9534f', marginTop: 0 }}>🚨 DETECÇÃO DE FRAUDE</h2>
                <p style={{ fontSize: '1.1em', margin: '20px 0' }}>
                    O banco identificou uma transação suspeita no seu cartão.
                </p>
                
                <div style={{background: '#f9f9f9', padding: '15px', borderRadius: '5px', textAlign: 'left', marginBottom: '20px'}}>
                    <p style={{margin: '5px 0'}}><strong>Local:</strong> {transaction.estabelecimento}</p>
                    <p style={{margin: '5px 0'}}><strong>Valor:</strong> R$ {transaction.valor.toFixed(2)}</p>
                    <p style={{margin: '5px 0'}}><strong>Horário:</strong> {new Date(transaction.dataHora).toLocaleTimeString()}</p>
                </div>

                <p style={{ fontWeight: 'bold' }}>Você reconhece esta compra?</p>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button 
                        onClick={onDeny} 
                        style={{ flex: 1, padding: '12px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                    >
                        NÃO RECONHEÇO
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={{ flex: 1, padding: '12px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                    >
                        SIM, FUI EU
                    </button>
                </div>
            </div>
        </div>
    );
};

const FraudAlertManager = () => {
    const [pendingTransaction, setPendingTransaction] = useState(null);

    useEffect(() => {
        // Função de Polling
        const checkFraud = async () => {
            // Só checa se estiver logado e não for admin
            const token = localStorage.getItem('token');
            const isUser = localStorage.getItem('userEmail') !== 'admin@simulacao.com';
            
            if (!token || !isUser) return;

            try {
                const response = await verificarPendencias();
                if (response.data && response.data.length > 0) {
                    // Pega a primeira pendência encontrada
                    setPendingTransaction(response.data[0]);
                } else {
                    setPendingTransaction(null);
                }
            } catch (error) {
                console.error("Erro silencioso no polling de fraude", error);
            }
        };

        // Executa a cada 3 segundos
        const interval = setInterval(checkFraud, 3000);
        
        // Executa imediatamente ao montar
        checkFraud();

        return () => clearInterval(interval);
    }, []);

    const handleConfirm = async () => {
        if (!pendingTransaction) return;
        try {
            await confirmTransaction(pendingTransaction.id);
            alert("Compra confirmada com sucesso!");
            setPendingTransaction(null);
            // Opcional: Recarregar a página para atualizar extratos se estiver nela
            if (window.location.pathname.includes('/transacoes') || window.location.pathname === '/dashboard') {
                window.location.reload();
            }
        } catch (error) {
            alert("Erro ao confirmar.");
        }
    };

    const handleDeny = async () => {
        if (!pendingTransaction) return;
        try {
            await denyTransaction(pendingTransaction.id);
            alert("Compra bloqueada por segurança.");
            setPendingTransaction(null);
            if (window.location.pathname.includes('/transacoes') || window.location.pathname === '/dashboard') {
                window.location.reload();
            }
        } catch (error) {
            alert("Erro ao negar.");
        }
    };

    if (!pendingTransaction) return null;

    return (
        <ConfirmationModal 
            transaction={pendingTransaction}
            onConfirm={handleConfirm}
            onDeny={handleDeny}
        />
    );
};

export default FraudAlertManager;