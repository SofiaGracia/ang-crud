import { TestBed } from '@angular/core/testing';
import { EditorFacade } from './editor.facade';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';

function makeNode(overrides: Partial<HtmlElementNode> = {}): HtmlElementNode {
  return {
    type: 'element',
    tag: 'div',
    attributes: {},
    children: [],
    ...overrides,
  };
}

describe('EditorFacade', () => {
  let facade: EditorFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EditorFacade] });
    facade = TestBed.inject(EditorFacade);
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
});
