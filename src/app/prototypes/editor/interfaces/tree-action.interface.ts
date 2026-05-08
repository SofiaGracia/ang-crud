import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';

export type ActionType = 'replace-tag' | 'add-class' | 'remove-node';

export interface ReplaceTagAction {
  type: 'replace-tag';
  targetNodePath: string;
  payload: {
    newTag: string;
  };
}

export interface AddClassAction {
  type: 'add-class';
  targetNodePath: string;
  payload: {
    className: string;
  };
}

export interface RemoveNodeAction {
  type: 'remove-node';
  targetNodePath: string;
  payload?: {
    removeChildren?: boolean;
  };
}

export type TreeAction = ReplaceTagAction | AddClassAction | RemoveNodeAction;

export interface ApplyActionResult {
  tree: HtmlElementNode;
  mutated: boolean;
}
