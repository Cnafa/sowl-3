
import React, { useState } from 'react';
import { WorkItem } from '../types';
import { useLocale } from '../context/LocaleContext';
import { TrashIcon, RepeatIcon } from './icons';
import { formatDate } from '../utils/dateUtils';

interface DeletedItemsViewProps {
    deletedItems: WorkItem[];
    onRestoreItem: (item: WorkItem) => void;
}

export const DeletedItemsView: React.FC<DeletedItemsViewProps> = ({ deletedItems, onRestoreItem }) => {
    const { t, locale } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = deletedItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <TrashIcon className="w-6 h-6 text-red-500" />
                    <h2 className="text-xl font-bold text-[#3B3936]">{t('deletedItems_view')}</h2>
                </div>
                <input
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#486966] outline-none w-64"
                />
            </header>

            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('title')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('deletedItems_table_deletedAt')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">{item.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.title}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(item.deletedAt, locale)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => onRestoreItem(item)}
                                        className="text-[#486966] hover:text-[#3a5a58] flex items-center justify-end gap-1 ml-auto border border-[#486966] px-2 py-1 rounded hover:bg-[#486966] hover:text-white transition-colors"
                                        title={t('deletedItems_restore')}
                                    >
                                        <RepeatIcon className="w-4 h-4" />
                                        {t('deletedItems_restore')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('deletedItems_empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
