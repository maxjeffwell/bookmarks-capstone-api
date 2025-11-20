import React from 'react';
import { AuthProvider } from './context/AuthContext';
import MainApp from './pages/MainApp';

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
