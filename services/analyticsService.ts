
// services/analyticsService.ts
import { WorkItem, Epic, User, Status, EpicProgressReportData, AssigneeWorkloadData, Sprint, SprintState } from '../types';
import { WIP_LIMIT } from '../constants';

// --- Helper for KPIs ---
export interface DashboardKPIs {
    avgVelocity: number;
    velocityTrend: number; // Percentage change
    completionRate: number; // Average completion rate %
    totalOpenBugs: number;
}

export const getDashboardKPIs = (workItems: WorkItem[], sprints: Sprint[]): DashboardKPIs => {
    const closedSprints = sprints.filter(s => s.state === SprintState.CLOSED);
    
    // 1. Velocity & Trend
    const sprintPoints: number[] = [];
    closedSprints.forEach(s => {
        const points = workItems
            .filter(i => i.doneInSprintId === s.id && i.status === Status.DONE)
            .reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
        sprintPoints.push(points);
    });

    const avgVelocity = sprintPoints.length > 0 
        ? sprintPoints.reduce((a, b) => a + b, 0) / sprintPoints.length 
        : 0;

    let velocityTrend = 0;
    if (sprintPoints.length >= 2) {
        const last = sprintPoints[sprintPoints.length - 1];
        const prev = sprintPoints[sprintPoints.length - 2];
        velocityTrend = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    }

    // 2. Completion Rate (Simulated Committed vs Done)
    // In a real app, we'd snapshot the sprint backlog at start time.
    // Here we approximate committed as Done + (Items still in sprint but not done) + 10% churn simulation
    let totalRate = 0;
    closedSprints.forEach(s => {
        const done = workItems
            .filter(i => i.doneInSprintId === s.id && i.status === Status.DONE)
            .reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
        // Simulating committed points being slightly higher than done usually
        const committed = Math.max(done, done * 1.15); 
        totalRate += (done / (committed || 1));
    });
    const completionRate = closedSprints.length > 0 ? (totalRate / closedSprints.length) * 100 : 0;

    // 3. Bugs
    const totalOpenBugs = workItems.filter(i => 
        (i.type === 'Bug (Urgent)' || i.type === 'Bug (Minor)') && i.status !== Status.DONE
    ).length;

    return {
        avgVelocity: Math.round(avgVelocity),
        velocityTrend: Math.round(velocityTrend),
        completionRate: Math.round(completionRate),
        totalOpenBugs
    };
};

// --- Burndown Chart Logic ---
export const getBurndownData = (sprintId: string, workItems: WorkItem[]) => {
    const sprintItems = workItems.filter(item => item.sprintId === sprintId);
    if (sprintItems.length === 0) return { labels: [], ideal: [], actual: [] };
    
    const sprintDuration = 14; // Assume 14 days for mock
    const labels = Array.from({ length: sprintDuration + 1 }, (_, i) => `Day ${i}`);
    
    const totalPoints = sprintItems.reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
    
    // Ideal line: linear descent
    const ideal = labels.map((_, i) => totalPoints - (totalPoints / sprintDuration) * i);
    
    // Actual line: calculated based on completion date
    let remainingPoints = totalPoints;
    const actual = [totalPoints];
    for (let i = 1; i <= sprintDuration; i++) {
        // This is a simplification. A real implementation would use transition logs.
        const completedThisDay = sprintItems.filter(item => {
            const dayOfSprint = (new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24);
            return item.status === Status.DONE && Math.ceil(dayOfSprint) === i;
        }).reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
        
        remainingPoints -= completedThisDay;
        // Don't show future days if mocked
        if (remainingPoints >= 0) actual.push(remainingPoints);
    }

    return { labels, ideal, actual, totalPoints };
};

// --- Velocity Chart Logic (Enhanced) ---
export const getVelocityData = (workItems: WorkItem[], sprints: Sprint[]) => {
    const closedSprints = sprints.filter(s => s.state === SprintState.CLOSED || s.state === SprintState.ACTIVE);
    const labels = closedSprints.map(s => s.name);
    
    const completedData: number[] = [];
    const committedData: number[] = []; // Simulated

    closedSprints.forEach(s => {
        const donePoints = workItems
            .filter(item => (item.doneInSprintId === s.id || (item.sprintId === s.id && item.status === Status.DONE)))
            .reduce((sum, item) => sum + (item.estimationPoints || 0), 0);
        
        completedData.push(donePoints);
        
        // Simulating Committed: Usually somewhat higher than done, or equal if perfect.
        // We add a random factor to make the chart interesting.
        const churn = Math.floor(Math.random() * 8); 
        committedData.push(donePoints + churn);
    });

    const average = completedData.length > 0 ? completedData.reduce((a, b) => a + b, 0) / completedData.length : 0;

    return { labels, completedData, committedData, average };
};


// --- Epics Progress Logic ---
export const getEpicProgressData = (epics: Epic[], workItems: WorkItem[]): EpicProgressReportData[] => {
    return epics.map(epic => {
        const epicItems = workItems.filter(item => item.epicId === epic.id);
        
        const totalItems = epicItems.length;
        const doneItems = epicItems.filter(i => i.status === Status.DONE).length;
        
        const totalEstimation = epicItems.reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
        const doneEstimation = epicItems
            .filter(i => i.status === Status.DONE)
            .reduce((sum, i) => sum + (i.estimationPoints || 0), 0);
            
        let progress = 0;
        if (totalEstimation > 0) {
            progress = (doneEstimation / totalEstimation) * 100;
        } else if (totalItems > 0) {
            progress = (doneItems / totalItems) * 100;
        }
        
        return {
            epic,
            totalItems,
            doneItems,
            totalEstimation,
            doneEstimation: Math.round(doneEstimation),
            progress,
        };
    }).sort((a,b) => b.epic.iceScore - a.epic.iceScore);
};

// --- Assignee Workload Logic ---
export const getAssigneeWorkloadData = (workItems: WorkItem[], users: User[]): AssigneeWorkloadData[] => {
    const workloadMap: Record<string, { open: number, inProgress: number, inReview: number, totalLoad: number }> = {};

    users.forEach(user => {
        workloadMap[user.id] = { open: 0, inProgress: 0, inReview: 0, totalLoad: 0 };
    });

    workItems.forEach(item => {
        if (item.assignees && item.assignees.length > 0) {
            item.assignees.forEach(assignee => {
                if (workloadMap[assignee.id]) {
                    if (item.status === Status.TODO || item.status === Status.BACKLOG) {
                        workloadMap[assignee.id].open++;
                    } else if (item.status === Status.IN_PROGRESS) {
                        workloadMap[assignee.id].inProgress++;
                    } else if (item.status === Status.IN_REVIEW) {
                        workloadMap[assignee.id].inReview++;
                    }
                }
            });
        }
    });

    return users.map(user => {
        const stats = workloadMap[user.id];
        const totalLoad = stats.open + stats.inProgress + stats.inReview;
        return {
            assignee: user,
            ...stats,
            totalLoad,
            wipBreached: stats.inProgress > WIP_LIMIT,
        };
    }).sort((a,b) => b.totalLoad - a.totalLoad);
};
