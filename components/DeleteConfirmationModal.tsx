
import React from 'react';
import { useLocale } from '../context/LocaleContext';

interface DeleteConfirmationModalProps {
    title: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ title, onClose, onConfirm }) => {
    const { t } = useLocale();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t('delete')}</h3>
                <p className="text-slate-600 mb-6">{t('delete_confirmation').replace('{title}', title)}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium text-sm">{t('cancel')}</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm shadow-sm">{t('delete')}</button>
                </div>
            </div>
        </div>
    );
};
