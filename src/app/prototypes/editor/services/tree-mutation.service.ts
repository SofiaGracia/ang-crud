import { Injectable } from '@angular/core';
import type { HtmlElementNode, HtmlNode } from '@prototypes/parser/interfaces/html-node.interface';
import type {
    TreeAction,
    ReplaceTagAction,
    AddClassAction,
    RemoveNodeAction,
    ApplyActionResult,
} from '@prototypes/editor/interfaces/tree-action.interface';

function isElementNode(node: HtmlNode): node is HtmlElementNode {
    return node.type === 'element';
}

function parsePathSegments(path: string): number[] | null {
    if (!path || !path.startsWith('/')) return null;
    if (path === '/') return [];
    const parts = path.split('/').filter(Boolean);
    const indices: number[] = [];
    for (let i = 0; i < parts.length; i += 2) {
        if (parts[i] !== 'children') return null;
        const idx = parseInt(parts[i + 1], 10);
        if (isNaN(idx)) return null;
        indices.push(idx);
    }
    return indices;
}

function cloneNode(node: HtmlElementNode): HtmlElementNode {
    return {
        ...node,
        children: node.children.map((child) =>
            child.type === 'element' ? cloneNode(child) : { ...child },
        ),
    };
}

const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function serializeAttributes(attributes: Record<string, string>): string {
    const entries = Object.entries(attributes);
    if (entries.length === 0) return '';
    return ' ' + entries
        .map(([key, value]) => (value === 'true' ? key : `${key}="${value.replace(/"/g, '&quot;')}"`))
        .join(' ');
}

export function serializeTreeToString(node: HtmlElementNode): string {
    const attrStr = serializeAttributes(node.attributes);

    if (VOID_ELEMENTS.has(node.tag)) {
        return `<${node.tag}${attrStr} />`;
    }

    const children = node.children
        .map((child) => (child.type === 'element' ? serializeTreeToString(child) : child.content))
        .join('');

    return `<${node.tag}${attrStr}>${children}</${node.tag}>`;
}

export function findNodeByPath(tree: HtmlElementNode, path: string): HtmlElementNode | null {
    const indices = parsePathSegments(path);
    if (!indices) return null;
    let current: HtmlElementNode = tree;

    for (const idx of indices) {
        const child = current.children[idx];
        if (!child || !isElementNode(child)) return null;
        current = child;
    }

    return current;
}

export function replaceTag(tree: HtmlElementNode, action: ReplaceTagAction): ApplyActionResult {
    const indices = parsePathSegments(action.targetNodePath);
    if (!indices) return { tree, mutated: false };
    if (indices.length === 0) {
        return { tree: { ...tree, tag: action.payload.newTag }, mutated: true };
    }

    const newTree = cloneNode(tree);
    let current = newTree;

    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        const child = current.children[idx];
        if (!child || !isElementNode(child)) return { tree, mutated: false };

        if (i === indices.length - 1) {
            (child as HtmlElementNode).tag = action.payload.newTag;
        } else {
            current = child;
        }
    }

    return { tree: newTree, mutated: true };
}

export function addClass(tree: HtmlElementNode, action: AddClassAction): ApplyActionResult {
    const indices = parsePathSegments(action.targetNodePath);
    if (!indices) return { tree, mutated: false };
    const className = action.payload.className;

    if (indices.length === 0) {
        const existing = tree.attributes['class'] ?? '';
        const classes = existing.split(/\s+/).filter(Boolean);
        if (classes.includes(className)) return { tree, mutated: false };
        return {
            tree: {
                ...tree,
                attributes: {
                    ...tree.attributes,
                    class: [...classes, className].join(' '),
                },
            },
            mutated: true,
        };
    }

    const newTree = cloneNode(tree);
    let current = newTree;

    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        const child = current.children[idx];
        if (!child || !isElementNode(child)) return { tree, mutated: false };

        if (i === indices.length - 1) {
            const el = child as HtmlElementNode;
            const existing = el.attributes['class'] ?? '';
            const classes = existing.split(/\s+/).filter(Boolean);
            if (classes.includes(className)) return { tree, mutated: false };
            el.attributes = {
                ...el.attributes,
                class: [...classes, className].join(' '),
            };
        } else {
            current = child;
        }
    }

    return { tree: newTree, mutated: true };
}

export function removeNode(tree: HtmlElementNode, action: RemoveNodeAction): ApplyActionResult {
    const indices = parsePathSegments(action.targetNodePath);
    if (!indices || indices.length === 0) return { tree, mutated: false };

    const parentIndices = indices.slice(0, -1);
    const targetIdx = indices[indices.length - 1];

    const newTree = cloneNode(tree);
    let current = newTree;

    for (let i = 0; i < parentIndices.length; i++) {
        const idx = parentIndices[i];
        const child = current.children[idx];
        if (!child || !isElementNode(child)) return { tree, mutated: false };
        current = child;
    }

    if (targetIdx < 0 || targetIdx >= current.children.length) return { tree, mutated: false };

    const target = current.children[targetIdx];
    const shouldRemoveChildren = action.payload?.removeChildren === true;

    if (shouldRemoveChildren && isElementNode(target)) {
        current.children = [
            ...current.children.slice(0, targetIdx),
            ...target.children,
            ...current.children.slice(targetIdx + 1),
        ];
    } else {
        current.children = [
            ...current.children.slice(0, targetIdx),
            ...current.children.slice(targetIdx + 1),
        ];
    }

    return { tree: newTree, mutated: true };
}

@Injectable({ providedIn: 'root' })
export class TreeMutationService {
    findNodeByPath(tree: HtmlElementNode, path: string): HtmlElementNode | null {
        return findNodeByPath(tree, path);
    }

    serializeTree(node: HtmlElementNode): string {
        return serializeTreeToString(node);
    }

    applyAction(tree: HtmlElementNode, action: TreeAction): ApplyActionResult {
        switch (action.type) {
            case 'replace-tag':
                return replaceTag(tree, action);
            case 'add-class':
                return addClass(tree, action);
            case 'remove-node':
                return removeNode(tree, action);
        }
    }
}
