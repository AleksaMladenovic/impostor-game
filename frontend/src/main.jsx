import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SignalRProvider>
        <App />
      </SignalRProvider>
    </AuthProvider>
  </StrictMode>
);
