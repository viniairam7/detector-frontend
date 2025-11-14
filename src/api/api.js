import axios from 'axios';

// Lembre-se de atualizar esta URL se você reiniciar o ngrok!
const API_URL = 'https://detector-50pn.onrender.com/api'; 
// const API_URL = 'http://localhost:8080/api'; // (Use este se não estiver usando ngrok)

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor que adiciona o token em TODAS as requisições
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('userToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; 
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
); 

// --- Nossas funções de API ---

export const registerUser = (userData) => {
    return apiClient.post('/usuarios', userData);
};

export const loginUser = (loginData) => {
    return apiClient.post('/auth/login', loginData); 
};

export const adicionarCartao = (cartaoData) => {
    return apiClient.post('/cartoes', cartaoData);
};

export const registrarTransacao = (transacaoData) => {
    return apiClient.post('/transacoes', transacaoData);
};

// --- FUNÇÕES QUE ESTAVAM FALTANDO ---
export const getMeusCartoes = () => {
    return apiClient.get('/cartoes/meus-cartoes');
};

export const getTransacoesDoCartao = (cartaoId) => {
    return apiClient.get(`/transacoes/cartao/${cartaoId}`);
};


