import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import { serializeTreeForAI } from '@prototypes/editor/services/tree-mutation.service';
import { AiAnalysisResponse } from '../interfaces/ai-analysis.interface';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
    private http = inject(HttpClient);

    analyze(tree: HtmlElementNode): Observable<AiAnalysisResponse> {
        const { annotatedTree, idToPath } = serializeTreeForAI(tree);

        return this.http
            .post<AiAnalysisResponse>(`${environment.supabaseEdgeFnUrl}/analyze-ui`, {
                annotatedTree,
                idToPath,
            })
            .pipe(
                timeout(30_000),
                catchError((err: HttpErrorResponse) => {
                    console.error('AI Analysis HTTP error:', err);
                    const message =
                        err.status === 429
                            ? 'Please wait a moment before requesting another analysis.'
                            : err.status === 0
                              ? 'Could not reach the analysis service. Check your connection.'
                              : err.error?.error || 'Analysis failed. Please try again.';
                    return throwError(() => new Error(message));
                }),
            );
    }
}
