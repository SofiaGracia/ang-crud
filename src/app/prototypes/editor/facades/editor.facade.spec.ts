import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditorFacade } from './editor.facade';
import { EditorSupabaseService } from '@prototypes/editor/services/editor-supabase.service';
import { AuthFacade } from '@auth/facades/auth.facade';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import { of } from 'rxjs';

function makeNode(overrides: Partial<HtmlElementNode> = {}): HtmlElementNode {
    return {
        type: 'element',
        tag: 'div',
        attributes: {},
        children: [],
        ...overrides,
    };
}

function createMockSupabaseService(overrides: Partial<{ getTree: () => any; upsertTree: () => any; deleteTree: () => any }> = {}) {
    return {
        getTree: () => of(null),
        upsertTree: () => of({ id: 1, prototype_id: 1, user_id: 'u1', tree: makeNode(), created_at: '', updated_at: '' }),
        deleteTree: () => of(undefined),
        ...overrides,
    };
}

const mockAuthFacade = {
    currentUserId: 'test-user-id',
};

function createFacade(supabaseServiceOverrides = {}): EditorFacade {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            EditorFacade,
            { provide: EditorSupabaseService, useValue: createMockSupabaseService(supabaseServiceOverrides) },
            { provide: AuthFacade, useValue: mockAuthFacade },
        ],
    });
    return TestBed.inject(EditorFacade);
}

describe('EditorFacade', () => {
    let facade: EditorFacade;

    beforeEach(() => {
        facade = createFacade();
    });

    it('initializes with null trees', () => {
        expect(facade.originalTree()).toBeNull();
        expect(facade.workingTree()).toBeNull();
    });

    it('loadTree sets both original and working tree as clones', () => {
        const tree = makeNode({ tag: 'body' });
        facade.loadTree(tree);
        expect(facade.originalTree()?.tag).toBe('body');
        expect(facade.workingTree()?.tag).toBe('body');
        expect(facade.workingTree()).not.toBe(tree);
    });

    it('dispatch applies replace-tag to working tree', () => {
        const tree = makeNode({ children: [makeNode({ tag: 'span' })] });
        facade.loadTree(tree);
        facade.dispatch({ type: 'replace-tag', targetNodePath: '/children/0', payload: { newTag: 'strong' } });
        const working = facade.workingTree()!;
        const child = working.children[0] as HtmlElementNode;
        expect(child.tag).toBe('strong');
        expect(facade.originalTree()!.children[0]).not.toBe(working.children[0]);
    });

    it('dispatch returns true when mutation occurs', () => {
        const tree = makeNode({ children: [makeNode({ tag: 'span' })] });
        facade.loadTree(tree);
        const result = facade.dispatch({ type: 'replace-tag', targetNodePath: '/children/0', payload: { newTag: 'strong' } });
        expect(result).toBe(true);
    });

    it('dispatch returns false when no mutation (invalid path)', () => {
        const tree = makeNode();
        facade.loadTree(tree);
        const result = facade.dispatch({ type: 'replace-tag', targetNodePath: '/children/99', payload: { newTag: 'strong' } });
        expect(result).toBe(false);
    });

    it('dispatch returns false when working tree is null', () => {
        const result = facade.dispatch({ type: 'replace-tag', targetNodePath: '/', payload: { newTag: 'div' } });
        expect(result).toBe(false);
    });

    it('reset restores working tree from original', () => {
        const tree = makeNode({ children: [makeNode({ tag: 'span' })] });
        facade.loadTree(tree);
        facade.dispatch({ type: 'replace-tag', targetNodePath: '/children/0', payload: { newTag: 'strong' } });
        expect((facade.workingTree()!.children[0] as HtmlElementNode).tag).toBe('strong');
        facade.reset();
        expect((facade.workingTree()!.children[0] as HtmlElementNode).tag).toBe('span');
    });

    it('reset does nothing when original tree is null', () => {
        facade.reset();
        expect(facade.workingTree()).toBeNull();
    });

    it('loadFromDb returns false when no saved tree', () => {
        const result = facade.loadFromDb(1);
        let loaded = true;
        result.subscribe((v) => (loaded = v));
        expect(loaded).toBe(false);
    });

    it('loadFromDb returns true when saved tree exists', () => {
        const savedTree = makeNode({ tag: 'saved' });
        const facadeWithTree = createFacade({
            getTree: () => of({ id: 1, prototype_id: 1, user_id: 'u1', tree: savedTree, created_at: '', updated_at: '' }),
        });
        const result = facadeWithTree.loadFromDb(1);
        let loaded = false;
        result.subscribe((v) => (loaded = v));
        expect(loaded).toBe(true);
        expect(facadeWithTree.workingTree()?.tag).toBe('saved');
    });

});
