export interface ProjectContract {
    id: number;
    name: string;
    description: string | null;
}

export interface PrototypeContract {
    id: number;
    name: string;
    description?: string | null;
    project_id?: number | null;
    tool?: string | null;
    url?: string | null;
}

export const validateProjectContract = (data: unknown): data is ProjectContract => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return typeof obj['id'] === 'number' && typeof obj['name'] === 'string';
};

export const validatePrototypeContract = (data: unknown): data is PrototypeContract => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return typeof obj['id'] === 'number' && typeof obj['name'] === 'string';
};

export const createMockProject = (overrides?: Partial<ProjectContract>): ProjectContract => ({
    id: 1,
    name: 'Test Project',
    description: 'Test description',
    ...overrides,
});

export const createMockPrototype = (overrides?: Partial<PrototypeContract>): PrototypeContract => ({
    id: 1,
    name: 'Test Prototype',
    description: 'Test description',
    project_id: 1,
    tool: 'Figma',
    url: 'https://example.com',
    ...overrides,
});