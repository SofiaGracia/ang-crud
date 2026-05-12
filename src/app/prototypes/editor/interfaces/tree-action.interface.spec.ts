import type { ReplaceTagAction, AddClassAction, RemoveNodeAction, TreeAction } from './tree-action.interface';

describe('TreeAction types', () => {
  it('narrows replace-tag action correctly', () => {
    const action: TreeAction = {
      type: 'replace-tag',
      targetNodePath: '/children/0',
      payload: { newTag: 'section' },
    };

    expect(action.type).toBe('replace-tag');
    expect((action as ReplaceTagAction).payload.newTag).toBe('section');
  });

  it('narrows add-class action correctly', () => {
    const action: TreeAction = {
      type: 'add-class',
      targetNodePath: '/children/0',
      payload: { className: 'container' },
    };

    expect(action.type).toBe('add-class');
    expect((action as AddClassAction).payload.className).toBe('container');
  });

  it('narrows remove-node action correctly', () => {
    const action: TreeAction = {
      type: 'remove-node',
      targetNodePath: '/children/0',
    };

    expect(action.type).toBe('remove-node');
    expect((action as RemoveNodeAction).payload).toBeUndefined();
  });

  it('remove-node accepts optional payload with removeChildren', () => {
    const action: TreeAction = {
      type: 'remove-node',
      targetNodePath: '/children/0',
      payload: { removeChildren: true },
    };

    expect((action as RemoveNodeAction).payload?.removeChildren).toBe(true);
  });

  it('rejects invalid action type at compile time', () => {
    const valid: TreeAction = { type: 'replace-tag', targetNodePath: '/', payload: { newTag: 'div' } };
    expect(valid.type).toBe('replace-tag');
  });
});
