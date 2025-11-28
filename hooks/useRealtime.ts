
import { useState, useEffect, useRef } from 'react';
import { WorkItem, User, ItemUpdateEvent, ConnectionStatus, Status } from '../types';

export const useRealtime = (
    isEnabled: boolean,
    workItems: WorkItem[],
    currentUser: User | null,
    onMessage: (message: ItemUpdateEvent) => void
) => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
    const onMessageRef = useRef(onMessage);

    // Update the ref whenever the handler changes, so the effect below always has the latest one
    // without needing to restart the connection simulation.
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);
    
    useEffect(() => {
        if (isEnabled && currentUser) {
            setConnectionStatus('CONNECTING');
            
            const connectTimeout = setTimeout(() => {
                setConnectionStatus('CONNECTED');
            }, 1500);

            return () => {
                clearTimeout(connectTimeout);
                setConnectionStatus('DISCONNECTED');
            };
        } else {
            setConnectionStatus('DISCONNECTED');
        }
    }, [isEnabled, currentUser]); // Removed onMessage from dependencies

    return { connectionStatus };
};
