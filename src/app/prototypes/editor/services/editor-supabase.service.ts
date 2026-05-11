import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { EditorTreeInterface } from '@prototypes/editor/interfaces/editor-tree.interface';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';

@Injectable({ providedIn: 'root' })
export class EditorSupabaseService {
    private supabase = inject(SupabaseClientService).instance;

    getTree(prototypeId: number): Observable<EditorTreeInterface | null> {
        const promise = this.supabase
            .from('prototype_trees')
            .select('*')
            .eq('prototype_id', prototypeId)
            .maybeSingle();

        return from(promise).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as unknown as EditorTreeInterface | null;
            }),
        );
    }

    upsertTree(
        prototypeId: number,
        userId: string,
        tree: HtmlElementNode,
    ): Observable<EditorTreeInterface> {
        const promise = this.supabase
            .from('prototype_trees')
            .upsert(
                {
                    prototype_id: prototypeId,
                    user_id: userId,
                    tree: tree as never,
                },
                { onConflict: 'prototype_id' },
            )
            .select()
            .single();

        return from(promise).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as unknown as EditorTreeInterface;
            }),
        );
    }

    deleteTree(prototypeId: number): Observable<void> {
        const promise = this.supabase
            .from('prototype_trees')
            .delete()
            .eq('prototype_id', prototypeId);

        return from(promise).pipe(
            map(({ error }) => {
                if (error) throw error;
            }),
        );
    }
}
