// Local: src/App.js
import React from 'react';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage'; // 1. Importa a nova página

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema Detector de Fraudes</h1>
      </header>
      <main>
        {/* Adicionamos um estilo simples para separá-los */}
        <div style={{ float: 'left', width: '50%' }}>
          <RegisterPage />
        </div>
        <div style={{ float: 'right', width: '50%' }}>
          <LoginPage /> {/* 2. Adiciona o componente de login */}
        </div>
      </main>
    </div>
  );
}

export default App;