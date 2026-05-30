import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
            // 24 hours of cache time to support long offline periods
            gcTime: 1000 * 60 * 60 * 24, 
		},
	},
});

export const persister = createSyncStoragePersister({
	storage: window.localStorage,
    key: 'FINANCEIROAPP_OFFLINE_CACHE'
});