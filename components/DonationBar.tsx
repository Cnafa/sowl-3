
import React, { useState } from 'react';
import { WalletIcon, DocumentDuplicateIcon, CheckCircleIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

export const DonationBar: React.FC = () => {
    const { t, locale } = useLocale();
    const [copied, setCopied] = useState(false);
    const address = "TDnhktYS5ugvGNpyxh5AkHi3U3QWbW83zM";

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div 
            className="fixed bottom-0 left-0 right-0 z-[40] bg-slate-900 text-white py-3 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm"
            dir={locale === 'fa-IR' ? 'rtl' : 'ltr'}
        >
            <div className="flex items-center gap-2 text-center sm:text-start">
                <WalletIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-200">{t('donation_text')}</span>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1 pr-1 pl-3 border border-slate-600">
                <code className="font-mono text-xs sm:text-sm text-emerald-300 truncate max-w-[200px] sm:max-w-none select-all">
                    {address}
                </code>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                    title={t('donation_copy')}
                >
                    {copied ? (
                        <>
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('donation_copied')}</span>
                        </>
                    ) : (
                        <>
                            <DocumentDuplicateIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('donation_copy')}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
