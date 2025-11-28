
import React, { useMemo } from 'react';
import { WorkItem, WorkItemType, User, Priority } from '../types';
import { UserRoundIcon, CheckSquareIcon, FlagIcon, TimerIcon, TrashIcon } from './icons';
import { useLocale } from '../context/LocaleContext';
import { useBoard } from '../context/BoardContext';

interface WorkItemCardProps {
  workItem: WorkItem;
  onSelect: (workItem: WorkItem) => void;
  isDragging?: boolean;
  onDelete?: (item: WorkItem) => void;
}

const typeConfig: Record<string, { label: string; classes: string; border: string }> = {
    [WorkItemType.STORY]: { label: "Story", classes: 'bg-gray-100 text-gray-700 border border-gray-200', border: 'border-l-emerald-500' },
    [WorkItemType.TASK]: { label: "Task", classes: 'bg-blue-50 text-blue-700 border border-blue-100', border: 'border-l-blue-500' },
    [WorkItemType.BUG_URGENT]: { label: "Bug", classes: 'bg-red-50 text-red-700 border border-red-100', border: 'border-l-red-600' },
    [WorkItemType.BUG_MINOR]: { label: "Bug", classes: 'bg-amber-50 text-amber-700 border border-amber-100', border: 'border-l-amber-500' },
    [WorkItemType.TICKET]: { label: "Ticket", classes: 'bg-gray-50 text-gray-600 border border-gray-200', border: 'border-l-slate-400' },
    [WorkItemType.EPIC]: { label: "Epic", classes: 'bg-purple-50 text-purple-700 border border-purple-100', border: 'border-l-purple-500' },
};

const getDueDateInfo = (dueDate: string | null | undefined, locale: string) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let classes = 'bg-slate-100 text-slate-600';
    let iconColor = 'text-slate-400';

    if (diffDays < 0) {
        classes = 'bg-red-100 text-red-700 font-medium';
        iconColor = 'text-red-500';
    } else if (diffDays === 0) {
        classes = 'bg-orange-100 text-orange-700 font-medium';
        iconColor = 'text-orange-500';
    } else if (diffDays <= 2) {
        classes = 'bg-amber-50 text-amber-700';
        iconColor = 'text-amber-500';
    }
    
    const localeCode = locale.split('-')[0];
    const formattedDate = new Intl.DateTimeFormat(localeCode, { month: 'short', day: 'numeric' }).format(due);

    return { text: formattedDate, classes, iconColor };
};

const PriorityIndicator: React.FC<{ priority: Priority }> = ({ priority }) => {
    if (priority === Priority.MEDIUM || priority === Priority.LOW) return null;
    
    const colorClass = priority === Priority.URGENT ? 'text-red-600' : 'text-orange-500';
    return (
        <div className={`flex items-center ${colorClass}`} title={`Priority: ${priority}`}>
            <FlagIcon className="w-3.5 h-3.5 fill-current" />
        </div>
    );
};

const ChecklistProgress: React.FC<{ items: any[] }> = ({ items }) => {
    if (!items || items.length === 0) return null;
    const completed = items.filter(i => i.isCompleted).length;
    return (
        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded" title="Checklist progress">
            <CheckSquareIcon className="w-3 h-3" />
            <span>{completed}/{items.length}</span>
        </div>
    );
};

const AssigneeAvatars: React.FC<{ assignees: User[], primary?: User }> = ({ assignees = [], primary }) => {
    const orderedAssignees = useMemo(() => {
        if (assignees.length === 0) return [];
        const primaryAssignee = primary || assignees[0];
        return [
            primaryAssignee,
            ...assignees.filter(a => a.id !== primaryAssignee.id)
        ];
    }, [assignees, primary]);

    if (orderedAssignees.length === 0) {
        return (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200" title="Unassigned">
                <UserRoundIcon className="w-3.5 h-3.5 text-slate-400" />
            </div>
        );
    }
    
    // Show max 2 avatars to save space in expanded view
    const displayCount = 2;
    const visible = orderedAssignees.slice(0, displayCount);
    const remainder = orderedAssignees.length - displayCount;

    return (
        <div className="flex items-center -space-x-1.5">
            {visible.map((assignee) => (
                <img
                    key={assignee.id}
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    title={assignee.name}
                    className="w-6 h-6 rounded-full border-2 border-white object-cover bg-white"
                />
            ))}
            {remainder > 0 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    +{remainder}
                </div>
            )}
        </div>
    );
};

export const WorkItemCard: React.FC<WorkItemCardProps> = ({ workItem, onSelect, isDragging, onDelete }) => {
  const { locale, t } = useLocale();
  const { can } = useBoard();
  const config = typeConfig[workItem.type] || typeConfig[WorkItemType.TICKET];
  const highlightClass = workItem.isUpdated ? 'ring-2 ring-primary ring-offset-1' : 'border-transparent';
  const dueDateInfo = getDueDateInfo(workItem.dueDate, locale);

  const onDeleteClick = (e: React.MouseEvent) => {
      // Critical: Stop propagation to prevent card selection
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      
      if (onDelete) {
          onDelete(workItem);
      }
  };

  return (
    <div
      onClick={() => onSelect(workItem)}
      className={`
        bg-white rounded-xl p-3 border border-slate-200 shadow-sm cursor-pointer group flex flex-col gap-2 ${highlightClass} relative overflow-hidden
        transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        ${isDragging ? 'opacity-40 grayscale' : 'opacity-100 hover:-translate-y-1 hover:rotate-1 hover:shadow-lg'}
      `}
    >
      {/* Left Border Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.border.replace('border-l-', 'bg-')}`}></div>

      {/* Header: ID, Points, Type */}
      <div className="flex justify-between items-start pl-2">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">{workItem.id}</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${config.classes}`}>
                {config.label}
            </span>
         </div>
         <div className="flex items-center gap-1">
             {workItem.estimationPoints > 0 && (
                 <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 border border-slate-100" title="Story Points">
                     <TimerIcon className="w-3 h-3 text-slate-400"/>
                     {workItem.estimationPoints}
                 </div>
             )}
         </div>
      </div>

      {/* Body: Title & Labels */}
      <div className="pl-2">
        <h3 
            title={workItem.title} 
            className="font-medium text-slate-800 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors"
        >
            {workItem.title}
        </h3>
        
        {/* Labels (Max 2) */}
        {workItem.labels && workItem.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
                {workItem.labels.slice(0, 2).map(label => (
                    <span key={label} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 truncate max-w-[80px]">
                        {label}
                    </span>
                ))}
                {workItem.labels.length > 2 && <span className="text-[10px] text-slate-400">...</span>}
            </div>
        )}
      </div>

      {/* Footer: Meta & Assignees */}
      <div className="flex justify-between items-end pt-1 pl-2 mt-auto border-t border-slate-50 relative">
        <div className="flex items-center gap-2">
            {/* Priority */}
            <PriorityIndicator priority={workItem.priority} />
            
            {/* Checklist */}
            <ChecklistProgress items={workItem.checklist} />

            {/* Due Date */}
            {dueDateInfo && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${dueDateInfo.classes}`}>
                    <span className={dueDateInfo.iconColor}>🕒</span>
                    <span>{dueDateInfo.text}</span>
                </div>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            {onDelete && (
                <button
                    type="button"
                    onClick={onDeleteClick}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-20 pointer-events-auto"
                    title={t('delete')}
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            )}
            <AssigneeAvatars assignees={workItem.assignees} primary={workItem.assignee} />
        </div>
      </div>
    </div>
  );
};