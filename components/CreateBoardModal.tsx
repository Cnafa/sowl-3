import React, { useState, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

interface CreateBoardModalProps {
    onClose: () => void;
    onCreate: (boardName: string, iconUrl?: string) => void;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ onClose, onCreate }) => {
    const [boardName, setBoardName] = useState('');
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLocale();

    const handleCreate = () => {
        if (boardName.trim()) {
            onCreate(boardName.trim(), iconUrl || undefined);
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'image/png') {
            if (file.size > 1 * 1024 * 1024) { // 1MB limit
                alert('Image is too large. Please use a PNG smaller than 1MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('Please upload a PNG file.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center gap-2 p-4 border-b">
                    <button type="button" onClick={onClose} title={t('cancel')} className="p-1 rounded-full hover:bg-gray-200">
                        <ChevronLeftIcon className="w-6 h-6 text-[#889C9B]" />
                    </button>
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('onboarding_create_modal_title')}</h2>
                </header>
                <main className="p-6 space-y-4">
                     <div className="flex flex-col items-center gap-2">
                        <input type="file" accept="image/png" ref={fileInputRef} onChange={handleIconChange} className="hidden" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-500"
                        >
                            {iconUrl ? (
                                <img src={iconUrl} alt="Board Icon" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <span>Upload PNG</span>
                            )}
                        </button>
                        <p className="text-xs text-gray-500">Optional: Board Icon (PNG, max 1MB)</p>
                    </div>
                     <div>
                        <label htmlFor="boardName" className="block text-sm font-medium text-[#486966] mb-1">{t('onboarding_create_modal_label')}</label>
                        <input
                            type="text"
                            id="boardName"
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            placeholder={t('onboarding_create_modal_placeholder')}
                            required
                            autoFocus
                            className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#486966]"
                        />
                    </div>
                </main>
                 <footer className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="py-2 px-4 border border-slate-400 rounded-md text-slate-800 hover:bg-slate-100">{t('cancel')}</button>
                    <button onClick={handleCreate} disabled={!boardName.trim()} className="py-2 px-4 bg-[#486966] text-white rounded-md disabled:bg-gray-400">{t('onboarding_create_modal_button')}</button>
                 </footer>
            </div>
        </div>
    );
};

export default CreateBoardModal;