import { Injectable, signal } from '@angular/core';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import type { TreeAction } from '@prototypes/editor/interfaces/tree-action.interface';
import { TreeMutationService } from '@prototypes/editor/services/tree-mutation.service';

@Injectable({ providedIn: 'root' })
export class EditorFacade {
  private readonly mutationService = new TreeMutationService();

  readonly originalTree = signal<HtmlElementNode | null>(null);
  readonly workingTree = signal<HtmlElementNode | null>(null);

  loadTree(tree: HtmlElementNode): void {
    console.log('CALLED LOAD TREE');
    this.originalTree.set(structuredClone(tree));
    this.workingTree.set(structuredClone(tree));
  }

  dispatch(action: TreeAction): boolean {
    const current = this.workingTree();
    if (!current) return false;

    const { tree, mutated } = this.mutationService.applyAction(current, action);
    if (mutated) {
      this.workingTree.set(tree);
    }
    return mutated;
  }

  reset(): void {
    const original = this.originalTree();
    if (original) {
      this.workingTree.set(structuredClone(original));
    }
  }
}
