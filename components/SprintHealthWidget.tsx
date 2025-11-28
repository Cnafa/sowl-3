
import React, { useMemo } from 'react';
import { Sprint, WorkItem, Status } from '../types';
import { useLocale } from '../context/LocaleContext';
import { TimerIcon, BarChart3Icon } from './icons';

interface SprintHealthWidgetProps {
    sprint: Sprint;
    workItems: WorkItem[];
    onClick: () => void;
}

export const SprintHealthWidget: React.FC<SprintHealthWidgetProps> = ({ sprint, workItems, onClick }) => {
    const { t } = useLocale();

    const stats = useMemo(() => {
        const now = new Date();
        const start = new Date(sprint.startAt);
        const end = new Date(sprint.endAt);
        
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        
        const diffTime = end.getTime() - now.getTime();
        let daysLabel = '';
        if (diffTime < 0) {
             daysLabel = t('sprint_ended_ago').replace('{days}', Math.ceil(-diffTime / (1000 * 60 * 60 * 24)).toString());
        } else {
             const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             daysLabel = t('sprint_days_left').replace('{days}', days.toString());
        }

        const totalPoints = workItems.reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
        const donePoints = workItems.filter(i => i.status === Status.DONE).reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
        const workProgress = totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0;

        // Health Logic
        // Green: Work is ahead or equal to time (with 10% buffer)
        // Yellow: Work is slightly behind (< 20% behind time)
        // Red: Work is significantly behind (> 20% behind time)
        const diff = workProgress - timeProgress;
        let statusKey: 'sprint_health_healthy' | 'sprint_health_at_risk' | 'sprint_health_critical' = 'sprint_health_healthy';
        let colorClass = 'bg-emerald-500';
        let textClass = 'text-emerald-700';
        let bgClass = 'bg-emerald-100';

        if (diff < -20) {
            statusKey = 'sprint_health_critical';
            colorClass = 'bg-red-500';
            textClass = 'text-red-700';
            bgClass = 'bg-red-100';
        } else if (diff < -5) {
            statusKey = 'sprint_health_at_risk';
            colorClass = 'bg-amber-500';
            textClass = 'text-amber-700';
            bgClass = 'bg-amber-100';
        }

        return { timeProgress, daysLabel, totalPoints, donePoints, workProgress, statusKey, colorClass, textClass, bgClass };
    }, [sprint, workItems, t]);

    return (
        <div 
            onClick={onClick}
            className={`relative flex items-center justify-between p-3 mb-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${stats.bgClass} border-opacity-50 border-${stats.colorClass.replace('bg-', '')}`}
        >
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold opacity-70 uppercase tracking-wider">{sprint.name}</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${stats.textClass}`}>{t(stats.statusKey)}</span>
                        <span className="text-xs opacity-60">• {t('sprint_health_done').replace('{percent}', Math.round(stats.workProgress).toString())}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 mx-6 flex flex-col justify-center gap-1">
                <div className="flex justify-between text-[10px] font-medium opacity-70">
                    <span>{stats.donePoints}/{stats.totalPoints} {t('sprint_health_pts')}</span>
                    <span>{stats.daysLabel}</span>
                </div>
                <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden relative">
                    {/* Time Marker */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-black/20 z-10" 
                        style={{ left: `${stats.timeProgress}%` }} 
                        title="Time Elapsed"
                    />
                    {/* Work Progress */}
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${stats.colorClass}`} 
                        style={{ width: `${stats.workProgress}%` }}
                    />
                </div>
            </div>

            <div className="p-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors">
                <BarChart3Icon className={`w-5 h-5 ${stats.textClass}`} />
            </div>
        </div>
    );
};
