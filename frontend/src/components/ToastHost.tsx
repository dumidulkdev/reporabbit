import { Toaster } from 'react-hot-toast';

export default function ToastHost() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#191a1b',
          color: '#f7f8f8',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#27a644', secondary: '#191a1b' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#191a1b' } },
      }}
    />
  );
}
