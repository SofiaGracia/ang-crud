import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import { findNodeByPath, replaceTag, addClass, removeNode, serializeTreeToString } from './tree-mutation.service';

function makeNode(overrides: Partial<HtmlElementNode> = {}): HtmlElementNode {
  return {
    type: 'element',
    tag: 'div',
    attributes: {},
    children: [],
    ...overrides,
  };
}

describe('findNodeByPath', () => {
  it('returns root for root path "/"', () => {
    const tree = makeNode({ tag: 'body' });
    expect(findNodeByPath(tree, '/')?.tag).toBe('body');
  });

  it('finds direct child', () => {
    const tree = makeNode({
      children: [makeNode({ tag: 'header' })],
    });
    expect(findNodeByPath(tree, '/children/0')?.tag).toBe('header');
  });

  it('finds nested child', () => {
    const tree = makeNode({
      children: [
        makeNode({
          tag: 'div',
          children: [makeNode({ tag: 'span' })],
        }),
      ],
    });
    expect(findNodeByPath(tree, '/children/0/children/0')?.tag).toBe('span');
  });

  it('returns null for out of bounds index', () => {
    const tree = makeNode({ children: [] });
    expect(findNodeByPath(tree, '/children/0')).toBeNull();
  });

  it('returns null when target is a text node', () => {
    const tree = makeNode({
      children: [{ type: 'text', content: 'hello' }],
    });
    expect(findNodeByPath(tree, '/children/0')).toBeNull();
  });

  it('returns null for malformed path', () => {
    const tree = makeNode();
    expect(findNodeByPath(tree, '')).toBeNull();
    expect(findNodeByPath(tree, 'invalid')).toBeNull();
    expect(findNodeByPath(tree, '/foo/bar')).toBeNull();
    expect(findNodeByPath(tree, '/children/abc')).toBeNull();
  });
});

describe('replaceTag', () => {
  it('replaces tag at root', () => {
    const tree = makeNode({ tag: 'div' });
    const { tree: result, mutated } = replaceTag(tree, {
      type: 'replace-tag',
      targetNodePath: '/',
      payload: { newTag: 'section' },
    });
    expect(result.tag).toBe('section');
    expect(mutated).toBe(true);
  });

  it('replaces tag on nested element', () => {
    const tree = makeNode({
      children: [makeNode({ tag: 'span' })],
    });
    const { tree: result, mutated } = replaceTag(tree, {
      type: 'replace-tag',
      targetNodePath: '/children/0',
      payload: { newTag: 'strong' },
    });
    const child = result.children[0] as HtmlElementNode;
    expect(child.tag).toBe('strong');
    expect(mutated).toBe(true);
  });

  it('preserves attributes and children after replacement', () => {
    const tree = makeNode({
      tag: 'div',
      attributes: { class: 'foo' },
      children: [makeNode({ tag: 'span', attributes: { id: 'bar' } })],
    });
    const { tree: result } = replaceTag(tree, {
      type: 'replace-tag',
      targetNodePath: '/',
      payload: { newTag: 'section' },
    });
    expect(result.tag).toBe('section');
    expect(result.attributes).toEqual({ class: 'foo' });
    expect((result.children[0] as HtmlElementNode).tag).toBe('span');
    expect((result.children[0] as HtmlElementNode).attributes).toEqual({ id: 'bar' });
  });

  it('does not mutate original tree (immutability)', () => {
    const tree = makeNode({ tag: 'div', children: [makeNode({ tag: 'span' })] });
    const originalTag = tree.tag;
    const { tree: result } = replaceTag(tree, {
      type: 'replace-tag',
      targetNodePath: '/',
      payload: { newTag: 'section' },
    });
    expect(tree.tag).toBe(originalTag);
    expect(result.tag).toBe('section');
    expect(tree).not.toBe(result);
  });

  it('returns mutated=false for invalid path', () => {
    const tree = makeNode();
    const { tree: result, mutated } = replaceTag(tree, {
      type: 'replace-tag',
      targetNodePath: '/children/99',
      payload: { newTag: 'section' },
    });
    expect(result).toBe(tree);
    expect(mutated).toBe(false);
  });
});

describe('addClass', () => {
  it('adds class to root node', () => {
    const tree = makeNode();
    const { tree: result, mutated } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/',
      payload: { className: 'container' },
    });
    expect(result.attributes['class']).toBe('container');
    expect(mutated).toBe(true);
  });

  it('adds class to nested element', () => {
    const tree = makeNode({
      children: [makeNode({ attributes: { class: 'old' } })],
    });
    const { tree: result } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/children/0',
      payload: { className: 'new' },
    });
    const child = result.children[0] as HtmlElementNode;
    expect(child.attributes['class']).toBe('old new');
  });

  it('does not duplicate existing class', () => {
    const tree = makeNode({ attributes: { class: 'foo' } });
    const { tree: result, mutated } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/',
      payload: { className: 'foo' },
    });
    expect(result.attributes['class']).toBe('foo');
    expect(mutated).toBe(false);
  });

  it('creates class attribute when node has none', () => {
    const tree = makeNode({ attributes: {} });
    const { tree: result } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/',
      payload: { className: 'foo' },
    });
    expect(result.attributes['class']).toBe('foo');
  });

  it('does not mutate original tree', () => {
    const tree = makeNode({ attributes: { class: 'old' } });
    const { tree: result } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/',
      payload: { className: 'new' },
    });
    expect(tree.attributes['class']).toBe('old');
    expect(result.attributes['class']).toBe('old new');
    expect(tree).not.toBe(result);
  });

  it('returns mutated=false for invalid path', () => {
    const tree = makeNode();
    const { mutated } = addClass(tree, {
      type: 'add-class',
      targetNodePath: '/children/99',
      payload: { className: 'foo' },
    });
    expect(mutated).toBe(false);
  });
});

describe('removeNode', () => {
  it('removes a direct child', () => {
    const tree = makeNode({
      children: [makeNode({ tag: 'header' }), makeNode({ tag: 'footer' })],
    });
    const { tree: result, mutated } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0',
    });
    expect(result.children).toHaveLength(1);
    expect((result.children[0] as HtmlElementNode).tag).toBe('footer');
    expect(mutated).toBe(true);
  });

  it('removes a deeply nested node', () => {
    const tree = makeNode({
      children: [
        makeNode({
          children: [makeNode({ tag: 'span' }), makeNode({ tag: 'strong' })],
        }),
      ],
    });
    const { tree: result } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0/children/0',
    });
    const parent = result.children[0] as HtmlElementNode;
    expect(parent.children).toHaveLength(1);
    expect((parent.children[0] as HtmlElementNode).tag).toBe('strong');
  });

  it('promotes children when removeChildren=true', () => {
    const tree = makeNode({
      children: [
        makeNode({
          tag: 'section',
          children: [makeNode({ tag: 'h1' }), makeNode({ tag: 'p' })],
        }),
      ],
    });
    const { tree: result } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0',
      payload: { removeChildren: true },
    });
    expect(result.children).toHaveLength(2);
    expect((result.children[0] as HtmlElementNode).tag).toBe('h1');
    expect((result.children[1] as HtmlElementNode).tag).toBe('p');
  });

  it('removes node and discards children when removeChildren=false', () => {
    const tree = makeNode({
      children: [
        makeNode({
          tag: 'section',
          children: [makeNode({ tag: 'h1' })],
        }),
      ],
    });
    const { tree: result } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0',
    });
    expect(result.children).toHaveLength(0);
  });

  it('cannot remove root node (path "/")', () => {
    const tree = makeNode();
    const { tree: result, mutated } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/',
    });
    expect(result).toBe(tree);
    expect(mutated).toBe(false);
  });

  it('returns mutated=false for out of bounds', () => {
    const tree = makeNode();
    const { mutated } = removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0',
    });
    expect(mutated).toBe(false);
  });

  it('does not mutate original tree', () => {
    const tree = makeNode({ children: [makeNode({ tag: 'span' })] });
    const originalLength = tree.children.length;
    removeNode(tree, {
      type: 'remove-node',
      targetNodePath: '/children/0',
    });
    expect(tree.children).toHaveLength(originalLength);
  });
});

describe('serializeTreeToString', () => {
  it('serializes a simple element', () => {
    expect(serializeTreeToString(makeNode({ tag: 'div' }))).toBe('<div></div>');
  });

  it('serializes void element as self-closing', () => {
    expect(serializeTreeToString(makeNode({ tag: 'br' }))).toBe('<br />');
    expect(serializeTreeToString(makeNode({ tag: 'img', attributes: { src: 'photo.jpg' } }))).toBe('<img src="photo.jpg" />');
  });

  it('serializes attributes', () => {
    const result = serializeTreeToString(makeNode({ tag: 'a', attributes: { href: '/link', class: 'btn' } }));
    expect(result).toBe('<a href="/link" class="btn"></a>');
  });

  it('serializes boolean attributes without value', () => {
    const result = serializeTreeToString(makeNode({ tag: 'button', attributes: { disabled: 'true' } }));
    expect(result).toBe('<button disabled></button>');
  });

  it('serializes text content', () => {
    const tree = makeNode({ tag: 'p', children: [{ type: 'text', content: 'Hello world' }] });
    expect(serializeTreeToString(tree)).toBe('<p>Hello world</p>');
  });

  it('serializes nested elements', () => {
    const tree = makeNode({
      children: [
        makeNode({ tag: 'header', children: [makeNode({ tag: 'h1', children: [{ type: 'text', content: 'Title' }] })] }),
        makeNode({ tag: 'footer' }),
      ],
    });
    expect(serializeTreeToString(tree)).toBe('<div><header><h1>Title</h1></header><footer></footer></div>');
  });

  it('escapes double quotes in attributes', () => {
    const tree = makeNode({ attributes: { 'data-value': 'he said "hello"' } });
    expect(serializeTreeToString(tree)).toBe('<div data-value="he said &quot;hello&quot;"></div>');
  });
});
