
// components/EpicEditor.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Epic, WorkItemType, InvestmentHorizon, EpicStatus } from '../types';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon, getIconByKey, ICON_MAP, WandIcon, MagnifyingGlassIcon } from './icons';
import { generateSummary, breakdownEpic } from '../services/geminiService';
import { isEqual } from 'lodash-es';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentsManager } from './AttachmentsManager';
import { EPIC_COLORS } from '../constants';
import { DateField } from './DateField';

interface EpicEditorProps {
  epic: Partial<Epic>;
  allEpics?: Epic[]; // For dependency selection
  onSave: (item: Partial<Epic>) => void;
  onCancel: () => void;
  isNew: boolean;
  highlightSection?: string;
  readOnly?: boolean;
  onCreateItems?: (items: any[]) => void; // For AI Breakdown
}

const ScoreSlider: React.FC<{ label: string, value: number, onChange: (value: number) => void, highlightKey?: string, disabled?: boolean }> = ({ label, value, onChange, highlightKey, disabled }) => (
    <div data-highlight-key={highlightKey}>
        <label className="flex justify-between text-sm font-medium text-[#3B3936]">
            <span>{label}</span>
            <span className="font-bold">{value}</span>
        </label>
        <input 
            type="range" 
            min="1" 
            max="10" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed accent-[#486966]"
        />
    </div>
);

// New Icon Picker Modal
const IconPickerModal: React.FC<{ onClose: () => void, onSelect: (icon: string) => void }> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const filteredIcons = useMemo(() => {
        if (!search) return Object.keys(ICON_MAP);
        return Object.keys(ICON_MAP).filter(key => key.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Search icons..." 
                        className="w-full bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-3">
                    {filteredIcons.map(key => (
                        <button 
                            key={key} 
                            onClick={() => { onSelect(key); onClose(); }}
                            className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-100 border border-transparent hover:border-slate-300 gap-1 transition-colors"
                            title={key}
                        >
                            {getIconByKey(key, { className: "w-6 h-6 text-slate-700" })}
                            <span className="text-[10px] text-gray-500 truncate w-full text-center">{key}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// AI Breakdown Modal
const BreakdownModal: React.FC<{ 
    suggestions: { title: string, description: string, type: string }[], 
    onClose: () => void, 
    onConfirm: (selected: any[]) => void 
}> = ({ suggestions, onClose, onConfirm }) => {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(suggestions.map((_, i) => i)));

    const toggle = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleConfirm = () => {
        const itemsToCreate = suggestions.filter((_, i) => selectedIndices.has(i));
        onConfirm(itemsToCreate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-200 bg-purple-50 rounded-t-lg flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-purple-900">
                        <WandIcon className="w-5 h-5 text-purple-600" />
                        AI Suggested Breakdown
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><XMarkIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                        These items will be automatically created and linked to this Epic. You can edit them later in the Items view.
                    </div>
                    {suggestions.map((item, i) => (
                        <div key={i} onClick={() => toggle(i)} className={`p-3 border rounded-md cursor-pointer flex gap-3 items-start transition-all ${selectedIndices.has(i) ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <div className={`w-5 h-5 mt-0.5 flex items-center justify-center border rounded ${selectedIndices.has(i) ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'}`}>
                                {selectedIndices.has(i) && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-600">{item.description}</div>
                                <div className="mt-1 text-[10px] uppercase font-bold text-slate-400">{item.type}</div>
                            </div>
                        </div>
                    ))}
                </main>
                <footer className="p-4 border-t border-slate-200 flex justify-end gap-2 rounded-b-lg bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white border border-transparent hover:border-slate-300 rounded-md transition-all">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-purple-700 transition-colors">
                        Create {selectedIndices.size} Items
                    </button>
                </footer>
            </div>
        </div>
    );
};

export const EpicEditor: React.FC<EpicEditorProps> = ({ epic, allEpics = [], onSave, onCancel, isNew, highlightSection, readOnly = false, onCreateItems }) => {
  const { t } = useLocale();
  
  // Initialize with default values for new epics
  const initialState = useMemo(() => ({
      ...epic,
      status: epic.status || EpicStatus.ACTIVE,
      impact: epic.impact || 5,
      confidence: epic.confidence || 5,
      ease: epic.ease || 5,
      color: epic.color || EPIC_COLORS[0],
      investmentHorizon: epic.investmentHorizon || InvestmentHorizon.NOW
  }), [epic]);

  const [localEpic, setLocalEpic] = useState<Partial<Epic>>(initialState);
  const [originalEpic, setOriginalEpic] = useState<Partial<Epic>>(initialState);
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDescriptionOverLimit, setIsDescriptionOverLimit] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // AI Breakdown State
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdownSuggestions, setBreakdownSuggestions] = useState<any[] | null>(null);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  const horizonDescriptions: Record<InvestmentHorizon, string> = {
    [InvestmentHorizon.NOW]: t('horizon_now_desc'),
    [InvestmentHorizon.NEXT]: t('horizon_next_desc'),
    [InvestmentHorizon.LATER]: t('horizon_later_desc'),
  };

  // Don't reset state blindly on prop change if we are editing to prevent overwrites, 
  // but do reset if ID changes (different item opened)
  useEffect(() => {
    if (epic.id !== localEpic.id) {
        setLocalEpic(initialState);
        setOriginalEpic(initialState);
    }
  }, [epic.id, initialState]);

  const hasChanges = !isEqual(originalEpic, localEpic);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    
    // Recalculate ICE score to ensure consistency
    const calculatedIce = ((localEpic.impact || 0) + (localEpic.confidence || 0) + (localEpic.ease || 0)) / 3;

    // Ensure we aren't saving undefined values that might cause crashes
    const finalEpic = {
        ...localEpic,
        iceScore: calculatedIce,
        status: localEpic.status || EpicStatus.ACTIVE,
        name: localEpic.name || 'Untitled Epic',
        color: localEpic.color || EPIC_COLORS[0], // Safety fallback
        updatedAt: new Date().toISOString()
    };
    onSave(finalEpic);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalEpic(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDescriptionChange = (html: string) => {
    setLocalEpic(prev => ({...prev, description: html }));
  };
  
  const handleGenerateSummary = async () => {
    if (!localEpic.name || !localEpic.description) {
      alert("Please provide a name and description before generating a summary.");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummary(localEpic.name, localEpic.description);
      setLocalEpic(prev => ({ ...prev, aiSummary: summary }));
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Could not generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleBreakdown = async () => {
      if (!localEpic.name || !localEpic.description) {
          alert("Please provide a name and description first.");
          return;
      }
      setIsBreakingDown(true);
      try {
          const suggestions = await breakdownEpic(localEpic.name, localEpic.description);
          if (suggestions && Array.isArray(suggestions)) {
              setBreakdownSuggestions(suggestions);
          } else {
              throw new Error("Invalid response format");
          }
      } catch (e) {
          alert("AI Breakdown failed. Please try again later.");
      } finally {
          setIsBreakingDown(false);
      }
  };

  const handleConfirmBreakdown = (items: any[]) => {
      if (onCreateItems) {
          const workItems = items.map(i => ({
              title: i.title,
              description: i.description, // Use simple description from AI
              type: i.type === 'Story' ? WorkItemType.STORY : WorkItemType.TASK,
              status: 'To Do', // Default
              epicId: localEpic.id, // Link to this epic (if saved)
              epicInfo: { id: localEpic.id, name: localEpic.name, color: localEpic.color }
          }));
          onCreateItems(workItems);
          setBreakdownSuggestions(null);
      }
  };

  const toggleDependency = (targetId: string) => {
      setLocalEpic(prev => {
          const current = new Set(prev.dependencies || []);
          if (current.has(targetId)) current.delete(targetId);
          else current.add(targetId);
          return { ...prev, dependencies: Array.from(current) };
      });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4" onMouseDown={handleBackdropMouseDown}>
      <div ref={editorContainerRef} className="bg-[#F0F4F4] rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-[#3B3936]">
            {isNew ? t('createNewEpic') : readOnly ? `Viewing Epic ${originalEpic.id}` : `Editing Epic ${originalEpic.id}`}
          </h2>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100 text-slate-500 transition-all">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 flex overflow-hidden">
          {/* Left Column: Main Content */}
          <div className="flex-[3] overflow-y-auto p-6 space-y-6 border-r border-slate-200 bg-white">
            <input
              type="text"
              name="name"
              value={localEpic.name || ''}
              onChange={handleChange}
              placeholder={t('epicName')}
              disabled={readOnly}
              className="w-full text-2xl font-bold px-2 py-2 border-b border-slate-300 focus:border-[#486966] focus:outline-none bg-transparent text-[#3B3936] disabled:bg-gray-50 placeholder-slate-300 transition-colors"
              data-highlight-key="name"
              required
            />
            
            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{t('startDate')}</label>
                    <DateField value={localEpic.startDate || null} onChange={(d) => setLocalEpic(p => ({...p, startDate: d || ''}))} disabled={readOnly} className="border-slate-300" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{t('endDate')}</label>
                    <DateField value={localEpic.endDate || null} onChange={(d) => setLocalEpic(p => ({...p, endDate: d || ''}))} disabled={readOnly} minDate={localEpic.startDate ? new Date(localEpic.startDate) : undefined} className="border-slate-300" />
                </div>
            </div>

            {/* Investment Horizon */}
            <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Investment Horizon</label>
                <div>
                    <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                        {[InvestmentHorizon.NOW, InvestmentHorizon.NEXT, InvestmentHorizon.LATER].map(h => (
                            <button
                                key={h}
                                onClick={() => !readOnly && setLocalEpic(p => ({...p, investmentHorizon: h}))}
                                disabled={readOnly}
                                className={`px-4 py-1 text-xs font-bold rounded transition-all ${localEpic.investmentHorizon === h ? 'bg-white shadow-sm text-[#486966]' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {h}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 h-4 pl-1">
                        {horizonDescriptions[localEpic.investmentHorizon || InvestmentHorizon.NOW]}
                    </p>
                </div>
            </div>

            <div data-highlight-key="aiSummary" className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-[#486966]">{t('aiPoweredSummary')}</label>
                  {!readOnly && (
                        <button
                            type="button"
                            onClick={handleGenerateSummary}
                            disabled={isGeneratingSummary || readOnly}
                            className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-blue-600 font-bold hover:bg-blue-50 flex items-center gap-1 shadow-sm"
                        >
                            <WandIcon className="w-3 h-3" />
                            {isGeneratingSummary ? 'Generating...' : 'Auto-Summarize'}
                        </button>
                   )}
              </div>
              <textarea
                name="aiSummary"
                value={localEpic.aiSummary || ''}
                onChange={handleChange}
                placeholder="A concise AI-generated summary will appear here."
                rows={3}
                disabled={readOnly}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#486966] disabled:bg-gray-100 text-sm"
              />
            </div>
            
            <div data-highlight-key="description">
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-[#486966]">{t('description')}</label>
                  {/* Suggest Stories Button */}
                  {!readOnly && (
                      <button 
                        onClick={handleBreakdown} 
                        disabled={isBreakingDown}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-200 hover:bg-purple-200 flex items-center gap-1 shadow-sm transition-all"
                      >
                          <WandIcon className="w-3 h-3" />
                          {isBreakingDown ? 'Thinking...' : 'Suggest Stories'}
                      </button>
                  )}
              </div>
               <RichTextEditor
                    value={localEpic.description || ''}
                    onChange={handleDescriptionChange}
                    onValidityChange={setIsDescriptionOverLimit}
                    editable={!readOnly}
                />
            </div>

             <div data-highlight-key="attachments">
              <label className="block text-sm font-bold text-[#486966] mb-2">{t('attachments')}</label>
              <AttachmentsManager attachments={localEpic.attachments || []} onChange={(atts) => setLocalEpic(prev => ({...prev, attachments: atts}))} readOnly={readOnly} />
            </div>
          </div>
          
          {/* Right Column: Metadata & Visuals */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-8 border-l border-slate-200">
            {/* Visual Identity */}
            <div>
                <h3 className="font-bold text-sm uppercase text-slate-500 tracking-wide border-b border-slate-200 pb-1 mb-4">Visual Identity</h3>
                
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">COLOR</label>
                    <div className="flex flex-wrap gap-2">
                        {EPIC_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => !readOnly && setLocalEpic(p => ({...p, color}))}
                                disabled={readOnly}
                                className={`w-8 h-8 rounded-md border transition-all shadow-sm ${localEpic.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">ICON</label>
                    <button 
                        onClick={() => !readOnly && setShowIconPicker(true)}
                        disabled={readOnly}
                        className="flex items-center gap-3 p-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 w-full transition-colors shadow-sm"
                    >
                        <div className="p-2 bg-gray-100 rounded text-slate-700">
                            {getIconByKey(localEpic.icon || 'mountain', { className: "w-5 h-5" })}
                        </div>
                        <span className="font-medium text-sm text-slate-700">{localEpic.icon || 'Select Icon...'}</span>
                    </button>
                </div>
            </div>

            {/* Dependencies */}
            <div>
                <h3 className="font-bold text-sm uppercase text-slate-500 tracking-wide border-b border-slate-200 pb-1 mb-4">Dependencies</h3>
                <div className="max-h-40 overflow-y-auto border border-slate-300 rounded-md bg-white p-2 shadow-sm">
                    {allEpics.filter(e => e.id !== localEpic.id).map(otherEpic => (
                        <label key={otherEpic.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={(localEpic.dependencies || []).includes(otherEpic.id)}
                                onChange={() => toggleDependency(otherEpic.id)}
                                disabled={readOnly}
                                className="rounded border-gray-300 text-[#486966] focus:ring-[#486966]"
                            />
                            <div className="flex-1 truncate text-xs font-medium text-slate-700">
                                {otherEpic.name}
                            </div>
                        </label>
                    ))}
                    {allEpics.length <= 1 && <p className="text-xs text-slate-400 italic text-center">No other epics available.</p>}
                </div>
            </div>

            {/* ICE Scoring */}
            <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-slate-500 tracking-wide border-b border-slate-200 pb-1 mb-2">{t('iceScoring')}</h3>
                <p className="text-[10px] text-slate-500 leading-tight">{t('iceScoringDesc')}</p>
                <ScoreSlider label={t('impact')} value={localEpic.impact || 5} onChange={val => setLocalEpic(p => ({...p, impact: val}))} highlightKey="impact" disabled={readOnly} />
                <ScoreSlider label={t('confidence')} value={localEpic.confidence || 5} onChange={val => setLocalEpic(p => ({...p, confidence: val}))} highlightKey="confidence" disabled={readOnly} />
                <ScoreSlider label={t('ease')} value={localEpic.ease || 5} onChange={val => setLocalEpic(p => ({...p, ease: val}))} highlightKey="ease" disabled={readOnly} />
                <div className="text-center pt-2" data-highlight-key="iceScore">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('iceScore')}</p>
                    <div className="inline-block bg-slate-800 text-white text-2xl font-mono font-bold px-4 py-2 rounded-lg shadow-md">
                        {((localEpic.impact || 0) + (localEpic.confidence || 0) + (localEpic.ease || 0)) / 3 > 0 ? (((localEpic.impact || 0) + (localEpic.confidence || 0) + (localEpic.ease || 0)) / 3).toFixed(1) : '0.0'}
                    </div>
                </div>
            </div>
          </div>
        </main>
        
        <footer className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-lg">
            {readOnly ? (
                 <button type="button" onClick={onCancel} className="py-2 px-6 border border-slate-300 rounded-md font-medium hover:bg-slate-50 text-slate-700">{t('close')}</button>
            ) : (
                <>
                    <button type="button" onClick={onCancel} className="py-2 px-6 border border-slate-300 rounded-md font-medium hover:bg-slate-50 text-slate-700 transition-all">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} disabled={!hasChanges || isDescriptionOverLimit} className="py-2 px-6 bg-[#486966] text-white font-bold rounded-md shadow-md hover:bg-[#3a5a58] active:translate-y-[1px] transition-all disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed">
                        {t('saveChanges')}
                    </button>
                </>
            )}
        </footer>
      </div>

      {showIconPicker && <IconPickerModal onClose={() => setShowIconPicker(false)} onSelect={icon => setLocalEpic(prev => ({...prev, icon}))} />}
      
      {breakdownSuggestions && (
          <BreakdownModal 
            suggestions={breakdownSuggestions} 
            onClose={() => setBreakdownSuggestions(null)} 
            onConfirm={handleConfirmBreakdown}
          />
      )}
    </div>
  );
};
