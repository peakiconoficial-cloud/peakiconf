import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar" }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm glass-panel p-6 shadow-neon-pink transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2 text-white glow-text-pink">{title}</h2>
        <p className="text-gray-300 mb-8">{message}</p>
        
        <div className="flex gap-4 justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-full font-bold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-full font-bold bg-primary text-white shadow-neon-pink hover:bg-pink-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
