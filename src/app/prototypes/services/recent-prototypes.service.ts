import { Injectable, signal } from '@angular/core';

export interface RecentPrototype {
    prototypeId: number;
    projectId: number;
    timestamp: number;
}

const STORAGE_KEY = 'recent_prototypes';
const MAX_RECENT = 10;

@Injectable({
    providedIn: 'root',
})
export class RecentPrototypesService {
    recentPrototypes = signal<RecentPrototype[]>(this.loadFromStorage());

    addRecentPrototype(prototypeId: number, projectId: number) {
        const existing = this.recentPrototypes();
        const filtered = existing.filter(
            (item) => !(item.prototypeId === prototypeId && item.projectId === projectId),
        );

        const updated: RecentPrototype[] = [
            { prototypeId, projectId, timestamp: Date.now() },
            ...filtered,
        ].slice(0, MAX_RECENT);

        this.recentPrototypes.set(updated);
        this.saveToStorage(updated);
    }

    getRecentPrototypes(): RecentPrototype[] {
        return this.recentPrototypes();
    }

    clearRecent() {
        this.recentPrototypes.set([]);
        localStorage.removeItem(STORAGE_KEY);
    }

    private loadFromStorage(): RecentPrototype[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }

    private saveToStorage(prototypes: RecentPrototype[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prototypes));
    }
}
