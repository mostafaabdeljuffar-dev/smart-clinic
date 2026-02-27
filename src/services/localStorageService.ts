export const localStorageService = {
    setItem<T>(key: string, value: T): void {
        try {
            const toStore =
                typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, toStore);
        } catch (err) {
            console.error(`Error saving ${key} to localStorage`, err);
        }
    },

    getItem<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            if (typeof raw === 'string' && (typeof ('' as any as T) === 'string')) {
                return raw as unknown as T;
            }

            return JSON.parse(raw) as T;
        } catch (err) {
            console.error(`Error reading ${key} from localStorage`, err);
            return null;
        }
    },

    removeItem(key: string): void {
        localStorage.removeItem(key);
    },

    clear(): void {
        localStorage.clear();
    },
};