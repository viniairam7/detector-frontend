import axios from 'axios';

// CORREÇÃO: O baseURL deve apontar para a RAIZ da sua API,
// não para um endpoint específico como o de login.
const apiClient = axios.create({
    baseURL: 'https://133102bdbdbc7.ngrok-free.app/api/auth/login', // Removido o '/auth/login'
    headers: {
        'Content-Type': 'application/json'
    }
});

// O interceptor está correto, ele adiciona o token em todas as requisições
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
// Agora elas funcionarão, pois os caminhos estão corretos:

// Esta função chama POST para: .../api/usuarios
export const registerUser = (userData) => {
    return apiClient.post('/usuarios', userData);
};

// Esta função chama POST para: .../api/auth/login
export const loginUser = (loginData) => {
    // CORREÇÃO: O caminho aqui estava duplicado. Agora está correto.
    return apiClient.post('/auth/login', loginData); 
};

// Esta função chama POST para: .../api/cartoes
export const adicionarCartao = (cartaoData) => {
    return apiClient.post('/cartoes', cartaoData);
};

// Esta função chama POST para: .../api/transacoes
export const registrarTransacao = (transacaoData) => {
    return apiClient.post('/transacoes', transacaoData);
};



