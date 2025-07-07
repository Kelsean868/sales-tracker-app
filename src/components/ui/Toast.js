import React, { useEffect, useState, useCallback } from 'react'; // FIX: Imported useCallback
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="text-green-400" />,
  error: <XCircle className="text-red-400" />,
  info: <Info className="text-blue-400" />,
};

const Toast = ({ message, type, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  // FIX: Wrapped handleDismiss in useCallback to satisfy the linter
  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 400);
  }, [onDismiss]);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [handleDismiss]); // FIX: Added handleDismiss to dependency array

  const bgColor = {
    success: 'bg-green-500/20 border-green-500/30',
    error: 'bg-red-500/20 border-red-500/30',
    info: 'bg-blue-500/20 border-blue-500/30',
  }[type];

  return (
    <div
      className={`flex items-start w-full max-w-sm p-4 rounded-lg shadow-lg border text-white transition-all duration-300 transform ${bgColor} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={handleDismiss} className="ml-4 flex-shrink-0 text-gray-400 hover:text-white">
        <X size={20} />
      </button>
    </div>
  );
};

export default Toast;
