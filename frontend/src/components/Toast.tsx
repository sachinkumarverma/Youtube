import { useState, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px',
                pointerEvents: 'none', width: 'auto', maxWidth: '90vw'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-in ${toast.type}`} style={{
                        pointerEvents: 'auto',
                        background: toast.type === 'success' ? '#2e7d32' : toast.type === 'error' ? '#d32f2f' : '#1976d2',
                        color: '#fff', padding: '12px 20px', borderRadius: '32px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        fontSize: '14px', fontWeight: '500', minWidth: '200px'
                    }}>
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', transition: 'opacity 0.2s' }} className="hover-opacity">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .toast-in {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
        </ToastContext.Provider>
    );
}
