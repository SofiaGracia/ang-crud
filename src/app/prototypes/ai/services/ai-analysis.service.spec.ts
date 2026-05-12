import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import { AiAnalysisService } from './ai-analysis.service';
import { environment } from '../../../../environments/environment';

function makeNode(overrides: Partial<HtmlElementNode> = {}): HtmlElementNode {
    return {
        type: 'element',
        tag: 'div',
        attributes: {},
        children: [],
        ...overrides,
    };
}

describe('AiAnalysisService', () => {
    let service: AiAnalysisService;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        service = TestBed.inject(AiAnalysisService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('sends serialized tree to the Edge Function', () => {
        const tree = makeNode({ tag: 'body', children: [makeNode({ tag: 'h1' })] });

        service.analyze(tree).subscribe();

        const req = httpMock.expectOne(`${environment.supabaseEdgeFnUrl}/analyze-ui`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            annotatedTree: 'ai-0 <body>\n  ai-1 <h1>',
            idToPath: { 'ai-0': '/', 'ai-1': '/children/0' },
        });
        req.flush({ summary: '', issues: [], suggestions: [] });
    });

    it('returns the AiAnalysisResponse on success', () => {
        const tree = makeNode();
        const mockResponse = {
            summary: 'Test summary',
            issues: [{ severity: 'high' as const, message: 'Test issue' }],
            suggestions: [
                {
                    id: 'sug-1',
                    type: 'semantic' as const,
                    title: 'Test',
                    description: 'Test desc',
                    actions: [],
                },
            ],
        };

        const result$ = service.analyze(tree);

        result$.subscribe((res) => {
            expect(res).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${environment.supabaseEdgeFnUrl}/analyze-ui`);
        req.flush(mockResponse);
    });

    it('handles 429 rate limit error', () => {
        const tree = makeNode();

        service.analyze(tree).subscribe({
            error: (err) => {
                expect(err.message).toBe(
                    'Please wait a moment before requesting another analysis.',
                );
            },
        });

        const req = httpMock.expectOne(`${environment.supabaseEdgeFnUrl}/analyze-ui`);
        req.flush({ error: 'Rate limit exceeded' }, { status: 429, statusText: 'Too Many Requests' });
    });

    it('handles network error', () => {
        const tree = makeNode();

        service.analyze(tree).subscribe({
            error: (err) => {
                expect(err.message).toBe(
                    'Could not reach the analysis service. Check your connection.',
                );
            },
        });

        const req = httpMock.expectOne(`${environment.supabaseEdgeFnUrl}/analyze-ui`);
        req.error(new ProgressEvent('Network error'));
    });

    it('handles generic server error with custom message', () => {
        const tree = makeNode();

        service.analyze(tree).subscribe({
            error: (err) => {
                expect(err.message).toBe('Custom server error');
            },
        });

        const req = httpMock.expectOne(`${environment.supabaseEdgeFnUrl}/analyze-ui`);
        req.flush(
            { error: 'Custom server error' },
            { status: 500, statusText: 'Internal Server Error' },
        );
    });

});
