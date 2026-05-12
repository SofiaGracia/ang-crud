import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';

export interface EditorTreeInterface {
    id: number;
    prototype_id: number;
    user_id: string;
    tree: HtmlElementNode;
    created_at: string;
    updated_at: string;
}
