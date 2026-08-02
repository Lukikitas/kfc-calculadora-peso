
import React from 'react';
import { ModalProps } from '../../types';
import { CloseIcon } from './Icons';

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'max-w-3xl', footerContent }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div 
        className={`relative mx-auto p-5 border w-full ${size} shadow-lg rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 flex flex-col`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="modal-title" className="text-xl leading-6 font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200" aria-label="Cerrar modal">
            <CloseIcon />
          </button>
        </div>
        <div className="mt-2 px-2 py-3 max-h-[70vh] overflow-y-auto flex-grow">
            {children}
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          {footerContent ? footerContent : (
            <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
                Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
