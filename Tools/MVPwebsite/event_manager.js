import { EventEmitter } from 'events';

export default class EventManager extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
    }

    emit(event, ...args) {
        return new Promise((resolve, reject) => {
            this.queue.push({ event, args, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { event, args, resolve, reject } = this.queue.shift();

            try {
                // Emit 'all' event before the specific event, if applicable
                if (event !== 'all') {
                    await this.emitEvent('all', event, ...args);
                }

                await this.emitEvent(event, ...args);
                resolve(); // Resolve the promise associated with this emit
            } catch (error) {
                reject(error); // Reject the promise if an error occurs
            }
        }

        this.isProcessing = false;
    }

    async emitEvent(event, ...args) {
        const listeners = this.listeners(event);

        // Execute each listener and collect promises
        const promises = listeners.map((listener) => {
            return new Promise((resolve, reject) => {
                try {
                    const result = listener(...args);

                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        // Wait for all listeners to complete
        await Promise.all(promises);
    }
}