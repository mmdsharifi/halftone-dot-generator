import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show }) => {
  const baseClasses = "fixed bottom-5 right-5 text-white py-3 px-6 rounded-lg shadow-2xl transition-all duration-500 ease-in-out transform z-50";
  const typeClasses = type === 'success' ? 'bg-indigo-500' : 'bg-red-600';
  const visibilityClasses = show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none';

  return (
    <div className={`${baseClasses} ${typeClasses} ${visibilityClasses}`}>
      <p className="font-semibold">{message}</p>
    </div>
  );
};
