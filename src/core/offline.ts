/**
 * DecorBiz Offline Billing & Queue Engine
 * PRD Section 9.2 & Section 20.5
 * Allows cashier to bill offline; buffers in local storage/IndexedDB;
 * marks with Device ID and "Number pending sync".
 * Detects stock conflicts upon sync.
 */

export interface OfflineBill {
  tempId: string;
  deviceId: string;
  createdAt: string;
  billData: any;
  status: 'pending_sync' | 'conflict' | 'synced';
  conflictReason?: string;
}

const OFFLINE_QUEUE_KEY = 'decorbiz_offline_bills';
const DEVICE_ID_KEY = 'decorbiz_device_id';
let memoryQueue: OfflineBill[] = [];

export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return 'DEV-SERVER';
  }
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getOfflineBillsQueue(): OfflineBill[] {
  if (typeof localStorage === 'undefined') {
    return [...memoryQueue];
  }
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
}

export function saveOfflineBill(billData: any): OfflineBill {
  const queue = getOfflineBillsQueue();
  const deviceId = getDeviceId();
  const tempId = `TEMP-${deviceId}-${Date.now()}`;

  const offlineEntry: OfflineBill = {
    tempId,
    deviceId,
    createdAt: new Date().toISOString(),
    billData,
    status: 'pending_sync',
  };

  queue.push(offlineEntry);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } else {
    memoryQueue = [...queue];
  }
  return offlineEntry;
}

export function updateOfflineBillStatus(tempId: string, status: 'synced' | 'conflict', conflictReason?: string) {
  const queue = getOfflineBillsQueue();
  const updated = queue.map((item) => {
    if (item.tempId === tempId) {
      return { ...item, status, conflictReason };
    }
    return item;
  });
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } else {
    memoryQueue = [...updated];
  }
}

export function removeOfflineBill(tempId: string) {
  const queue = getOfflineBillsQueue();
  const filtered = queue.filter((item) => item.tempId !== tempId);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } else {
    memoryQueue = [...filtered];
  }
}
