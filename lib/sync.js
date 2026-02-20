import localforage from 'localforage';
import { submitCycleLog } from './api';

localforage.config({
    name: 'WomensWellness',
    storeName: 'offline_logs'
});

export const QUEUE_KEY = 'pending_symptom_logs';

export async function queueFailedLog(logData) {
    try {
        const queue = await localforage.getItem(QUEUE_KEY) || [];
        queue.push({ ...logData, timestamp: Date.now() });
        await localforage.setItem(QUEUE_KEY, queue);
        return true;
    } catch (error) {
        console.error('Failed to queue log:', error);
        return false;
    }
}

export async function getQueuedLogsCount() {
    try {
        const queue = await localforage.getItem(QUEUE_KEY) || [];
        return queue.length;
    } catch {
        return 0;
    }
}

export async function syncQueuedLogs() {
    if (typeof window === 'undefined' || !navigator.onLine) return 0;

    try {
        const queue = await localforage.getItem(QUEUE_KEY) || [];
        if (queue.length === 0) return 0;

        let syncedCount = 0;
        const remainingQueue = [];

        for (const log of queue) {
            try {
                await submitCycleLog(log.userId, log.date, log.symptoms);
                syncedCount++;
            } catch (err) {
                remainingQueue.push(log);
            }
        }

        await localforage.setItem(QUEUE_KEY, remainingQueue);
        if (syncedCount > 0) {
            window.dispatchEvent(new CustomEvent('offline-logs-synced', { detail: { count: syncedCount } }));
        }

        return syncedCount;
    } catch (error) {
        console.error('Sync failed:', error);
        return 0;
    }
}
