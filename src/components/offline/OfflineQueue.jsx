import { base44 } from "@/api/base44Client";

const QUEUE_KEY = 'offline_action_queue';

export class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  add(action) {
    this.queue.push({
      id: Date.now() + Math.random(),
      action,
      timestamp: Date.now(),
      retries: 0
    });
    this.saveQueue();
  }

  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) {
      return;
    }

    console.log(`Processing ${this.queue.length} offline actions...`);

    const results = { success: 0, failed: 0 };

    for (const item of [...this.queue]) {
      try {
        await this.executeAction(item.action);
        this.removeFromQueue(item.id);
        results.success++;
      } catch (error) {
        console.error('Failed to execute action:', error);
        item.retries++;
        
        if (item.retries >= 3) {
          this.removeFromQueue(item.id);
          results.failed++;
        }
      }
    }

    this.saveQueue();
    
    console.log(`Sync complete: ${results.success} success, ${results.failed} failed`);
    
    return results;
  }

  async executeAction(action) {
    const { type, entity, data, id } = action;

    switch (type) {
      case 'create':
        return await base44.entities[entity].create(data);
      
      case 'update':
        return await base44.entities[entity].update(id, data);
      
      case 'delete':
        return await base44.entities[entity].delete(id);
      
      default:
        throw new Error('Unknown action type: ' + type);
    }
  }

  removeFromQueue(actionId) {
    this.queue = this.queue.filter(item => item.id !== actionId);
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  getQueueSize() {
    return this.queue.length;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => {
      offlineQueue.processQueue();
    }, 1000);
  });
}