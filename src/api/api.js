import axios from 'axios';

// Configuração da instância do Axios
const api = axios.create({
  baseURL: 'https://detector-50pn.onrender.com',
});

// =====================================================================
// (NOVO) Interceptor de Requisição (Anexa o token automaticamente)
// =====================================================================
api.interceptors.request.use(
  (config) => {
    // Rotas públicas que NÃO devem receber o token
    const publicRoutes = [
      '/api/auth/login',
      '/api/usuarios'
    ];

    if (publicRoutes.includes(config.url)) {
      return config; // Não anexa o token
    }

    // Para todas as outras rotas, anexa o token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================================
// (NOVO) Interceptor de Resposta (Lida com 401 - Expirado/Inválido)
// =====================================================================
api.interceptors.response.use(
  (response) => {
    // Se a resposta for 2xx, apenas a retorna
    return response;
  },
  (error) => {
    // Se recebermos um erro 401 (Não Autorizado)
    if (error.response && error.response.status === 401) {
      // Remove o token inválido do localStorage
      localStorage.removeItem('token');
      // Redireciona para a página de login
      // (Evita que o usuário fique "preso" em uma página autenticada com um token ruim)
      window.location.href = '/login';
      
      // Retorna uma mensagem de erro clara
      return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
    }
    // Para todos os outros erros, apenas os repassa
    return Promise.reject(error);
  }
);


// --- FUNÇÕES DE AUTENTICAÇÃO ---
// (Mantêm o Content-Type, pois são rotas públicas)

export const login = (email, senha) => {
  return api.post('/api/auth/login', { email, senha }, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const register = (nome, email, senha) => {
  return api.post('/api/usuarios', { nome, email, senha }, {
    headers: { 'Content-Type': 'application/json' }
  });
};


// --- FUNÇÕES DE CARTÃO ---
// (Agora estão limpas, sem a lógica manual de token)

export const getCards = () => {
  return api.get('/api/cartoes/meus');
};

export const addCard = (cartaoData) => {
  return api.post('/api/cartoes', cartaoData);
};


// --- FUNÇÕES DE TRANSAÇÃO ---
// (Também limpas, sem a lógica manual de token)

export const getTransacoesDoCartao = (cartaoId) => {
  return api.get(`/api/cartoes/${cartaoId}/transacoes`);
};

export const addTransaction = (transacaoData) => {
  return api.post('/api/transacoes', transacaoData);
};

export const confirmTransaction = (transacaoId) => {
  return api.post(`/api/transacoes/${transacaoId}/confirmar`, {});
};

export const denyTransaction = (transacaoId) => {
  return api.post(`/api/transacoes/${transacaoId}/negar`, {});
};

// --- FUNÇÃO DE USUÁRIO ---
// (Também limpa, sem a lógica manual de token)

export const setHorarioHabitual = (horarioInicio, horarioFim) => {
  return api.put('/api/usuarios/meu-horario', { horarioInicio, horarioFim });
};

export const getDadosSimulacao = () => {
  return api.get('/api/usuarios/admin/simulacao-dados');
};

export const updateLocation = (latitude, longitude) => {
  return api.put('/api/usuarios/minha-localizacao', { latitude, longitude });
};

export const verificarPendencias = () => {
  return api.get('/api/transacoes/pendentes');
};

export default api;