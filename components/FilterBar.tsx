
// components/FilterBar.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilterSet, Team, Sprint, User, WorkItemType, Priority } from '../types';
import { ALL_USERS, PRIORITIES } from '../constants';
import { useLocale } from '../context/LocaleContext';
import { BookmarkPlusIcon, FolderCogIcon, XMarkIcon, MagnifyingGlassIcon, TagIcon, FlagIcon, UserRoundIcon, TimerIcon } from './icons';

// --- Start of US-51 SelectedAssigneesChips Component ---

// A hook to get the window size category for responsiveness
const useWindowSize = () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>('lg');
    useEffect(() => {
        const updateSize = () => {
            if (window.innerWidth < 640) setSize('sm');
            else if (window.innerWidth < 1024) setSize('md');
            else setSize('lg');
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

interface SelectedAssigneesChipsProps {
  selectedUsers: User[];
  onRemove: (userId: string) => void;
  onClearAll: () => void;
}

const SelectedAssigneesChips: React.FC<SelectedAssigneesChipsProps> = ({ selectedUsers, onRemove, onClearAll }) => {
    const { t } = useLocale();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [search, setSearch] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, () => setIsPopoverOpen(false));
    const screenSize = useWindowSize();

    const maxVisible = useMemo(() => {
        if (screenSize === 'sm') return 0;
        if (screenSize === 'md') return 1;
        return 2;
    }, [screenSize]);

    const visibleUsers = selectedUsers.slice(0, maxVisible);
    const overflowCount = selectedUsers.length - maxVisible;

    const filteredPopoverUsers = useMemo(() => {
        if (!search) return selectedUsers;
        return selectedUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    }, [search, selectedUsers]);

    if (selectedUsers.length === 0) return null;

    return (
        <div className="flex items-center gap-1.5" ref={popoverRef}>
            {/* Visible Chips */}
            {visibleUsers.map(user => (
                <div key={user.id} className="h-7 px-2 rounded-full border bg-white text-xs flex items-center gap-1 shadow-sm whitespace-nowrap">
                    <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="max-w-[80px] truncate" title={user.name}>{user.name}</span>
                    <button onClick={() => onRemove(user.id)} className="p-0.5 rounded-full hover:bg-gray-100" aria-label={`Remove ${user.name}`}>
                        <XMarkIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
            {/* Avatar Stack for small screens */}
            {screenSize === 'sm' && selectedUsers.slice(0, 2).map((user, index) => (
                <img key={user.id} src={user.avatarUrl} alt={user.name} title={user.name} className={`w-7 h-7 rounded-full object-cover border-2 border-white ${index > 0 ? '-ml-2' : ''}`} />
            ))}

            {/* Counter Chip */}
            {overflowCount > 0 && (
                 <button 
                    onClick={() => setIsPopoverOpen(true)}
                    className="h-7 px-2 rounded-full bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer text-xs font-medium whitespace-nowrap"
                    aria-label={`Open selected assignees (${overflowCount} more)`}
                    title={t('filters_assignees_more').replace('{count}', overflowCount.toString())}
                 >
                    +{overflowCount > 99 ? '99+' : overflowCount}
                </button>
            )}

            {/* Popover */}
            {isPopoverOpen && (
                <div className="absolute top-full mt-2 z-20 w-72 bg-white rounded-lg shadow-lg border">
                    <div className="p-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-semibold">{t('filters_assignees_selected')}</h3>
                        <button onClick={onClearAll} className="text-xs text-primary hover:underline">{t('actions_clearAll')}</button>
                    </div>
                    <div className="p-2 border-b">
                         <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900 focus:outline-none focus:border-primary"/>
                    </div>
                    <ul className="max-h-60 overflow-auto p-1">
                        {filteredPopoverUsers.map(user => (
                            <li key={user.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                    <span className="text-sm">{user.name}</span>
                                </div>
                                <button onClick={() => onRemove(user.id)} className="p-1 rounded-full hover:bg-gray-200" aria-label={`Remove ${user.name}`}>
                                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
// --- End of US-51 Component ---


const FilterChip: React.FC<{ onRemove: () => void; children: React.ReactNode }> = ({ onRemove, children }) => (
    <div className="flex items-center gap-1 bg-primarySoft text-primary font-medium ps-2 pe-1 py-0.5 rounded-full text-xs border border-primary/20 whitespace-nowrap shadow-sm">
        {children}
        <button onClick={onRemove} className="p-0.5 rounded-full hover:bg-blue-200">
            <XMarkIcon className="w-3 h-3"/>
        </button>
    </div>
);

const FilterToggleButton: React.FC<{ 
    isActive: boolean; 
    onClick: () => void; 
    label: string; 
    icon: React.ReactNode;
}> = ({ isActive, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            isActive 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
        }`}
    >
        {icon}
        {label}
    </button>
);


const MultiSelectDropdown: React.FC<{
  buttonContent: React.ReactNode;
  items: { id: string, name: string, content: React.ReactNode }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
}> = ({ buttonContent, items, selectedIds, onSelectionChange, searchable = false, searchPlaceholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));
  const { t } = useLocale();

  const filteredItems = useMemo(() => {
    if (!searchable || !search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(lowerSearch));
  }, [items, search, searchable]);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    onSelectionChange(Array.from(newSet));
  };

  return (
    <div className="relative" ref={dropdownRef}>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full min-w-[110px] max-w-[180px] flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary text-start transition-colors shadow-sm">
           <div className="flex items-center gap-2 truncate">
               {icon}
               <span className="text-xs font-medium truncate">{buttonContent}</span>
           </div>
           <svg className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        {isOpen && (
            <div className="absolute z-20 w-64 mt-1 bg-white border rounded-md shadow-lg text-start">
                {searchable && <div className="p-2 border-b"><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder || t('search')} className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900 focus:outline-none focus:border-primary"/></div>}
                <ul className="max-h-60 overflow-auto p-1">
                    {filteredItems.map(item => (
                        <li key={item.id} className="px-2 py-1.5 text-xs text-slate-900 cursor-pointer hover:bg-gray-100 rounded-md flex items-center gap-2 transition-colors">
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleToggle(item.id)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                            {item.content}
                        </li>
                    ))}
                    {filteredItems.length === 0 && <li className="px-2 py-2 text-xs text-gray-500 text-center">No items found</li>}
                </ul>
            </div>
        )}
    </div>
  );
};

interface FilterBarProps {
  filterSet: FilterSet;
  onFilterChange: (filters: FilterSet) => void;
  onResetFilters: () => void;
  onOpenSaveViewModal: () => void;
  onOpenManageViewsModal: () => void;
  teams: Team[];
  groupBy: 'status' | 'epic';
  onGroupByChange: (groupBy: 'status' | 'epic') => void;
  activeSprint: Sprint | null | undefined;
  includeUnassignedEpicItems: boolean;
  onIncludeUnassignedEpicItemsChange: (checked: boolean) => void;
  availableLabels: string[];
}

const FILTERABLE_TYPES = [
    WorkItemType.STORY,
    WorkItemType.TASK,
    WorkItemType.BUG_URGENT,
    WorkItemType.BUG_MINOR,
];


export const FilterBar: React.FC<FilterBarProps> = ({ 
    filterSet, onFilterChange, onResetFilters, onOpenSaveViewModal, onOpenManageViewsModal, teams, groupBy, onGroupByChange,
    activeSprint, includeUnassignedEpicItems, onIncludeUnassignedEpicItemsChange, availableLabels
}) => {
  const { t } = useLocale();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filterSet, [e.target.name]: e.target.value });
  };
  
  const isFiltered = filterSet.searchQuery !== '' || filterSet.assigneeIds.length > 0 || filterSet.typeIds.length > 0 || filterSet.teamIds.length > 0 || filterSet.priorities.length > 0 || filterSet.labels.length > 0 || filterSet.onlyMyItems || filterSet.onlyOverdue;

  const selectedUsers = useMemo(() => 
    filterSet.assigneeIds.map(id => ALL_USERS.find(u => u.id === id)).filter((u): u is User => !!u),
    [filterSet.assigneeIds]
  );

  return (
    <div className="relative z-20 flex flex-col flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      
      {/* Row 1: Search & View Controls */}
      <div className="flex items-center justify-between p-2 border-b border-slate-100 gap-4">
          <div className="relative flex-grow max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                type="search"
                name="searchQuery"
                value={filterSet.searchQuery}
                onChange={handleInputChange}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
          </div>

          <div className="flex items-center gap-3">
             {activeSprint && groupBy === 'epic' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-50 border border-slate-200">
                    <input
                        type="checkbox"
                        id="include-unassigned"
                        checked={includeUnassignedEpicItems}
                        onChange={(e) => onIncludeUnassignedEpicItemsChange(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="include-unassigned" className="text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap select-none">{t('include_items_without_epic')}</label>
                </div>
            )}

             <div className="flex items-center gap-2">
                <select
                    name="groupBy"
                    value={groupBy}
                    onChange={(e) => onGroupByChange(e.target.value as 'status' | 'epic')}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer hover:bg-gray-50"
                >
                    <option value="status">{t('filterbar_groupBy_status')}</option>
                    <option value="epic">{t('filterbar_groupBy_epic')}</option>
                </select>
             </div>

             <div className="flex items-center border-l border-slate-300 pl-3 gap-1">
                <button onClick={onOpenSaveViewModal} title={t('saveView')} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors">
                    <BookmarkPlusIcon className="w-5 h-5" />
                </button>
                <button onClick={onOpenManageViewsModal} title={t('manageViews')} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors">
                    <FolderCogIcon className="w-5 h-5" />
                </button>
             </div>
          </div>
      </div>

      {/* Row 2: Filters & Active Chips */}
      <div className="flex items-center gap-3 p-2 min-h-[48px]">
        
        {/* Static Controls Group (No overflow hidden/auto here to allow dropdowns) */}
        <div className="flex items-center gap-3 flex-shrink-0">
            {/* Quick Filters Group */}
            <div className="flex items-center gap-2">
                <FilterToggleButton
                    isActive={filterSet.onlyMyItems}
                    onClick={() => onFilterChange({ ...filterSet, onlyMyItems: !filterSet.onlyMyItems })}
                    label={t('filter_myItems')}
                    icon={<UserRoundIcon className="w-3.5 h-3.5" />}
                />
                <FilterToggleButton
                    isActive={filterSet.onlyOverdue}
                    onClick={() => onFilterChange({ ...filterSet, onlyOverdue: !filterSet.onlyOverdue })}
                    label={t('filter_overdue')}
                    icon={<TimerIcon className="w-3.5 h-3.5" />}
                />
                <div className="w-px h-6 bg-slate-300 mx-1" />
            </div>

            {/* Dropdown Group */}
            <div className="flex items-center gap-2">
                <MultiSelectDropdown
                    buttonContent={filterSet.assigneeIds.length > 0 ? t('filterbar_assignees_plural').replace('{count}', filterSet.assigneeIds.length.toString()) : t('allAssignees')}
                    items={ALL_USERS.map(u => ({ id: u.id, name: u.name, content: <><img src={u.avatarUrl} alt={u.name} className="w-4 h-4 rounded-full" /><span>{u.name}</span></> }))}
                    selectedIds={filterSet.assigneeIds}
                    onSelectionChange={(ids) => onFilterChange({...filterSet, assigneeIds: ids})}
                    searchable
                    searchPlaceholder={t('search')}
                />
                
                <MultiSelectDropdown
                    buttonContent={filterSet.priorities.length > 0 ? t('filterbar_priorities_plural').replace('{count}', filterSet.priorities.length.toString()) : t('allPriorities')}
                    items={PRIORITIES.map(p => ({ id: p, name: p, content: p }))}
                    selectedIds={filterSet.priorities}
                    onSelectionChange={(ids) => onFilterChange({...filterSet, priorities: ids as Priority[]})}
                    icon={<FlagIcon className="w-3 h-3 text-slate-400" />}
                />

                <MultiSelectDropdown
                    buttonContent={filterSet.labels.length > 0 ? t('filterbar_labels_plural').replace('{count}', filterSet.labels.length.toString()) : t('allLabels')}
                    items={availableLabels.map(l => ({ id: l, name: l, content: l }))}
                    selectedIds={filterSet.labels}
                    onSelectionChange={(ids) => onFilterChange({...filterSet, labels: ids})}
                    searchable
                    searchPlaceholder={t('search')}
                    icon={<TagIcon className="w-3 h-3 text-slate-400" />}
                />
                
                <MultiSelectDropdown
                    buttonContent={filterSet.teamIds.length > 0 ? t('filterbar_teams_plural').replace('{count}', filterSet.teamIds.length.toString()) : t('allTeams')}
                    items={teams.map(t => ({ id: t.id, name: t.name, content: t.name }))}
                    selectedIds={filterSet.teamIds}
                    onSelectionChange={(ids) => onFilterChange({...filterSet, teamIds: ids})}
                />

                <MultiSelectDropdown
                    buttonContent={filterSet.typeIds.length > 0 ? t('filterbar_types_plural').replace('{count}', filterSet.typeIds.length.toString()) : t('allTypes')}
                    items={FILTERABLE_TYPES.map(type => ({id: type, name: type, content: type}))}
                    selectedIds={filterSet.typeIds}
                    onSelectionChange={(ids) => onFilterChange({...filterSet, typeIds: ids})}
                />
            </div>
        </div>

        {isFiltered && <div className="w-px h-6 bg-slate-300 mx-1 flex-shrink-0" />}

        {/* Active Chips Group - Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            <SelectedAssigneesChips
                selectedUsers={selectedUsers}
                onRemove={(userId) => onFilterChange({ ...filterSet, assigneeIds: filterSet.assigneeIds.filter(id => id !== userId) })}
                onClearAll={() => onFilterChange({ ...filterSet, assigneeIds: [] })}
            />

            {filterSet.teamIds.map(id => {
            const team = teams.find(t => t.id === id);
            if (!team) return null;
            return <FilterChip key={id} onRemove={() => onFilterChange({...filterSet, teamIds: filterSet.teamIds.filter(i => i !== id)})}>
                {team.name}
            </FilterChip>
            })}

            {filterSet.typeIds.map(typeId => (
                <FilterChip key={typeId} onRemove={() => onFilterChange({ ...filterSet, typeIds: filterSet.typeIds.filter(id => id !== typeId) })}>
                    {typeId}
                </FilterChip>
            ))}

            {filterSet.priorities.map(p => (
                <FilterChip key={p} onRemove={() => onFilterChange({ ...filterSet, priorities: filterSet.priorities.filter(id => id !== p) })}>
                    {p}
                </FilterChip>
            ))}
            
            {filterSet.labels.map(l => (
                <FilterChip key={l} onRemove={() => onFilterChange({ ...filterSet, labels: filterSet.labels.filter(id => id !== l) })}>
                    {l}
                </FilterChip>
            ))}

            {isFiltered && (
                <button onClick={onResetFilters} className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors whitespace-nowrap">
                    {t('clearFilters')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
