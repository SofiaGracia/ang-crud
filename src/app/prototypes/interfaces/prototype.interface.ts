export interface Prototype {
    name: string;
    tool: string | null;
    url: string | null;
    description: string | null;
    project_id: number;
    user_id?: string;
    deleted_at?: string | null;
}

export interface PrototypeInterface {
    id: number;
    name: string;
    description?: string | null;
    project_id?: number | null;
    tool?: string | null;
    url?: string | null;
    user_id?: string;
    deleted_at?: string | null;
}
