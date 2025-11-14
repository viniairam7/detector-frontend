import axios from 'axios';

// Configuração da instância do Axios
const api = axios.create({
  // URL base da sua API no Render
  baseURL: 'https://detector-50pn.onrender.com', 
});

// --- FUNÇÕES DE AUTENTICAÇÃO ---

export const login = (email, senha) => {
  return api.post('/api/auth/login', { email, senha });
};

export const register = (nome, email, senha) => {
  // Nota: O backend espera /api/usuarios, não /api/auth/register
  return api.post('/api/usuarios', { nome, email, senha });
};


// --- FUNÇÕES DE CARTÃO ---

export const getCards = () => {
  const token = localStorage.getItem('token');
  return api.get('/api/cartoes/meus', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

/**
 * (CORRIGIDO) Adiciona o token ao cabeçalho.
 */
export const addCard = (cartaoData) => {
  // 1. Pega o token do localStorage
  const token = localStorage.getItem('token');
  
  // 2. Envia o token nos headers da requisição POST
  return api.post('/api/cartoes', cartaoData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};


// --- FUNÇÕES DE TRANSAÇÃO ---

/**
 * (NOVO) Busca o extrato (transações) de um cartão específico.
 * Requerido pela TransacoesPage.js
 */
export const getTransacoesDoCartao = (cartaoId) => {
  const token = localStorage.getItem('token');
  // NOTA: O backend não tem esta rota! Você precisará criá-la.
  // Vou assumir que a rota será /api/cartoes/{cartaoId}/transacoes
  // *** Ajuste esta URL conforme a rota que você criar no backend ***
  return api.get(`/api/cartoes/${cartaoId}/transacoes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Se você não quiser criar uma rota nova, esta função não funcionará.
  // A TransacoesPage precisaria de outra lógica.
};

/**
 * (NOVO) Registra uma nova transação.
 * Agora, espera uma resposta 200 OK com status (COMPLETED ou PENDING).
 */
export const addTransaction = (transacaoData) => {
  const token = localStorage.getItem('token');
  return api.post('/api/transacoes', transacaoData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

/**
 * (NOVO) Confirma uma transação que estava pendente.
 */
export const confirmTransaction = (transacaoId) => {
  const token = localStorage.getItem('token');
  return api.post(`/api/transacoes/${transacaoId}/confirmar`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

/**
 * (NOVO) Nega uma transação que estava pendente.
 */
export const denyTransaction = (transacaoId) => {
  const token = localStorage.getItem('token');
  return api.post(`/api/transacoes/${transacaoId}/negar`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export default api;