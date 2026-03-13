export interface Prototype {
    name: string;
    tool: string;
    url: string;
    description: string;
    project_id: number;
}

export interface PrototypeInterface {
    id: number;
    name: string;
    description?: string | null;
    project_id?: number | null;
    tool?: string | null;
    url?: string | null;
}
