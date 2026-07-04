import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isError = type === 'error';

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${
      isError 
        ? 'bg-red-950/90 text-red-200 border-red-800' 
        : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
    } glass`}>
      {isError ? (
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
      )}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
