
// components/ReportsDashboard.tsx
import React, { useState, useMemo } from 'react';
import { WorkItem, Epic, Team, User, ReportType, Sprint } from '../types';
import * as analytics from '../services/analyticsService';
import { useLocale } from '../context/LocaleContext';
import { XMarkIcon, BarChart3Icon, ActivityIcon, UsersIcon, MountainIcon, ChevronRightIcon } from './icons';

// --- Prop Interfaces ---
interface ReportsDashboardProps {
    workItems: WorkItem[];
    epics: Epic[];
    teams: Team[];
    users: User[];
    sprints: Sprint[];
}

// --- KPI Card Component ---
const KPICard: React.FC<{ title: string, value: string | number, trend?: number, suffix?: string, icon?: React.ReactNode }> = ({ title, value, trend, suffix, icon }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">{title}</span>
                {icon && <span className="text-slate-400">{icon}</span>}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-800">{value}</span>
                {suffix && <span className="text-sm text-slate-500 mb-1">{suffix}</span>}
            </div>
            {trend !== undefined && (
                <div className={`text-xs font-bold flex items-center ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last sprint
                </div>
            )}
        </div>
    );
};

// --- Enhanced Charts ---

const EnhancedLineChart: React.FC<{ data: { labels: string[], datasets: { label: string, data: number[], color: string, borderDash?: number[] }[] } }> = ({ data }) => {
    const { t } = useLocale();
    if (!data.labels || data.labels.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">{t('report_no_data')}</div>;

    const allValues = data.datasets.flatMap(d => d.data);
    const max = Math.max(...allValues, 10);
    
    return (
        <div className="w-full h-full flex flex-col pt-4 pb-8 relative">
            <div className="flex-1 flex relative border-b border-l border-slate-200 ml-8 mb-4">
                {/* Y-Axis Labels */}
                <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 py-1">
                    <span>{Math.round(max)}</span>
                    <span>{Math.round(max/2)}</span>
                    <span>0</span>
                </div>

                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {data.datasets.map((ds, idx) => {
                        const points = ds.data.map((val, i) => {
                            const x = (i / (data.labels.length - 1)) * 100;
                            const y = 100 - ((val / max) * 100);
                            return `${x},${y}`;
                        }).join(' ');

                        return (
                            <g key={ds.label}>
                                <polyline 
                                    fill="none" 
                                    stroke={ds.color} 
                                    strokeWidth="3" 
                                    strokeDasharray={ds.borderDash ? ds.borderDash.join(',') : 'none'}
                                    points={points} 
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Data Points */}
                                {ds.data.map((val, i) => {
                                     const x = (i / (data.labels.length - 1)) * 100;
                                     const y = 100 - ((val / max) * 100);
                                     return (
                                         <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" fill="white" stroke={ds.color} strokeWidth="2" className="hover:r-4 transition-all" >
                                            <title>{`${ds.label}: ${val}`}</title>
                                         </circle>
                                     )
                                })}
                            </g>
                        )
                    })}
                </svg>
            </div>
            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 px-1">
                {data.labels.map((l, i) => {
                    // Show every other label if too many
                    if (data.labels.length > 10 && i % 2 !== 0) return null;
                    return <span key={i}>{l}</span>;
                })}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {data.datasets.map(ds => (
                    <div key={ds.label} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ds.color }}></div>
                        {ds.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

const DualBarChart: React.FC<{ labels: string[], committed: number[], completed: number[], avg: number }> = ({ labels, committed, completed, avg }) => {
    const { t } = useLocale();
    const max = Math.max(...committed, ...completed, avg, 10);

    return (
        <div className="w-full h-full flex flex-col pt-4 pb-2">
            <div className="flex-1 flex items-end justify-between gap-2 border-b border-slate-200 pb-px relative">
                {/* Average Line */}
                <div 
                    className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400 opacity-50 pointer-events-none"
                    style={{ bottom: `${(avg / max) * 100}%` }}
                >
                    <span className="absolute -top-3 right-0 text-[9px] bg-slate-100 px-1 rounded text-slate-500">Avg: {avg.toFixed(0)}</span>
                </div>

                {labels.map((label, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                        <div className="w-full flex justify-center gap-1 h-full items-end">
                            {/* Committed Bar */}
                            <div 
                                className="w-3 md:w-5 bg-slate-300 rounded-t-sm transition-all group-hover:bg-slate-400 relative"
                                style={{ height: `${(committed[i] / max) * 100}%` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-1 rounded pointer-events-none z-10">{committed[i]}</div>
                            </div>
                            {/* Completed Bar */}
                            <div 
                                className="w-3 md:w-5 bg-[#486966] rounded-t-sm transition-all group-hover:bg-[#3a5a58] relative"
                                style={{ height: `${(completed[i] / max) * 100}%` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-1 rounded pointer-events-none z-10">{completed[i]}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-2">
                {labels.map(l => <span key={l} className="truncate max-w-[50px]">{l}</span>)}
            </div>
            <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600"><div className="w-3 h-3 bg-slate-300 rounded-sm"></div> Committed</div>
                <div className="flex items-center gap-2 text-xs text-slate-600"><div className="w-3 h-3 bg-[#486966] rounded-sm"></div> Completed</div>
            </div>
        </div>
    );
};

// --- Main Component ---
export const ReportsDashboard: React.FC<ReportsDashboardProps> = (props) => {
    const { t } = useLocale();
    const [selectedReport, setSelectedReport] = useState<ReportType>(ReportType.BURNDOWN);
    const [sprintFilter, setSprintFilter] = useState<string>(props.sprints[1]?.id || props.sprints[0]?.id || '');
    
    // Calculate Data
    const burndown = useMemo(() => analytics.getBurndownData(sprintFilter, props.workItems), [sprintFilter, props.workItems]);
    const velocity = useMemo(() => analytics.getVelocityData(props.workItems, props.sprints), [props.workItems, props.sprints]);
    const epicProgress = useMemo(() => analytics.getEpicProgressData(props.epics, props.workItems), [props.epics, props.workItems]);
    const workload = useMemo(() => analytics.getAssigneeWorkloadData(props.workItems, props.users), [props.workItems, props.users]);
    const kpis = useMemo(() => analytics.getDashboardKPIs(props.workItems, props.sprints), [props.workItems, props.sprints]);

    // Navigation Items
    const navItems = [
        { id: ReportType.BURNDOWN, label: t('report_burndown_title'), icon: <ActivityIcon className="w-4 h-4"/> },
        { id: ReportType.VELOCITY, label: t('report_velocity_title'), icon: <BarChart3Icon className="w-4 h-4"/> },
        { id: ReportType.EPIC_PROGRESS, label: t('report_epic_progress_title'), icon: <MountainIcon className="w-4 h-4"/> },
        { id: ReportType.ASSIGNEE_WORKLOAD, label: t('report_assignee_workload_title'), icon: <UsersIcon className="w-4 h-4"/> },
    ];

    const renderChartArea = () => {
        switch (selectedReport) {
            case ReportType.BURNDOWN:
                return (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{t('report_burndown_title')}</h3>
                                <p className="text-sm text-slate-500">{t('report_burndown_description')}</p>
                            </div>
                            <select value={sprintFilter} onChange={e => setSprintFilter(e.target.value)} className="p-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#486966]">
                                {props.sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <EnhancedLineChart data={{
                                labels: burndown.labels,
                                datasets: [
                                    { label: t('report_ideal_line'), data: burndown.ideal, color: '#94a3b8', borderDash: [5, 5] },
                                    { label: t('report_actual_line'), data: burndown.actual, color: '#486966' }
                                ]
                            }} />
                        </div>
                    </div>
                );
            case ReportType.VELOCITY:
                return (
                    <div className="h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">{t('report_velocity_title')}</h3>
                            <p className="text-sm text-slate-500">{t('report_velocity_description')}</p>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <DualBarChart 
                                labels={velocity.labels} 
                                committed={velocity.committedData} 
                                completed={velocity.completedData} 
                                avg={velocity.average} 
                            />
                        </div>
                    </div>
                );
            case ReportType.EPIC_PROGRESS:
                return (
                    <div className="h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">{t('report_epic_progress_title')}</h3>
                            <p className="text-sm text-slate-500">{t('report_epic_progress_description')}</p>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <DataInspector 
                                headers={[t('epic'), 'Progress', 'Estimated', 'Completed']} 
                                data={epicProgress.map(d => [
                                    <span className="font-medium text-slate-700">{d.epic.name}</span>, 
                                    `${d.progress.toFixed(0)}%`, 
                                    d.totalEstimation, 
                                    d.doneEstimation
                                ])} 
                                renderProgress={1}
                            />
                        </div>
                    </div>
                );
            case ReportType.ASSIGNEE_WORKLOAD:
                return (
                    <div className="h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800">{t('report_assignee_workload_title')}</h3>
                            <p className="text-sm text-slate-500">{t('report_assignee_workload_description')}</p>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <DataInspector
                                headers={[t('assignee'), 'Open', 'In Progress', 'In Review', 'Total']}
                                data={workload.map(d => [
                                    <div className="flex items-center gap-2"><img src={d.assignee.avatarUrl} className="w-6 h-6 rounded-full"/><span>{d.assignee.name}</span></div>,
                                    d.open,
                                    d.inProgress,
                                    d.inReview,
                                    d.totalLoad
                                ])}
                                highlightRow={(row, i) => workload[i].wipBreached}
                            />
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-2">
            {/* KPI Deck */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                <KPICard title="Average Velocity" value={kpis.avgVelocity} suffix="pts" trend={kpis.velocityTrend} icon={<BarChart3Icon className="w-5 h-5"/>} />
                <KPICard title="Completion Rate" value={`${kpis.completionRate}%`} icon={<ActivityIcon className="w-5 h-5"/>} />
                <KPICard title="Active Epics" value={props.epics.filter(e => e.status === 'ACTIVE').length} icon={<MountainIcon className="w-5 h-5"/>} />
                <KPICard title="Open Bugs" value={kpis.totalOpenBugs} icon={<div className="text-red-500 font-bold">!</div>} />
            </div>

            {/* Main Dashboard Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <nav className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedReport(item.id as ReportType)}
                            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${selectedReport === item.id ? 'bg-white text-[#486966] shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
                        >
                            <span className={`p-1.5 rounded-md ${selectedReport === item.id ? 'bg-[#486966]/10' : 'bg-slate-100'}`}>{item.icon}</span>
                            {item.label}
                            {selectedReport === item.id && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                        </button>
                    ))}
                </nav>

                {/* Main Chart Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
                    {renderChartArea()}
                </div>
            </div>
        </div>
    );
};

const DataInspector: React.FC<{ headers: string[], data: (string|number|undefined|React.ReactNode)[][], renderProgress?: number, highlightRow?: (row: any, i: number) => boolean }> = ({ headers, data, renderProgress, highlightRow }) => {
    return (
        <table className="min-w-full divide-y divide-slate-100">
            <thead>
                <tr>{headers.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                    <tr key={i} className={`hover:bg-slate-50 ${highlightRow && highlightRow(row, i) ? 'bg-red-50' : ''}`}>
                        {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                {j === renderProgress ? (
                                     <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
                                            <div className="bg-[#486966] h-2 rounded-full" style={{ width: cell?.toString() }}></div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">{cell}</span>
                                     </div>
                                ) : cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
