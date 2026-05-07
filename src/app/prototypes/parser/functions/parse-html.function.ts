import { HtmlNode } from '@prototypes/parser/interfaces/html-node.interface';
import { walkDom } from '@prototypes/parser/functions/walk-dom.function';

export function parseHtml(html: string): HtmlNode[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const isFullDocument =
        /<html[\s>]/i.test(html) || /<!doctype/i.test(html);

    if (isFullDocument) {
        const htmlNode = walkDom(doc.documentElement);
        return htmlNode ? [htmlNode] : [];
    }

    const nodes: HtmlNode[] = [];
    const sourceNodes = [...Array.from(doc.head.childNodes), ...Array.from(doc.body.childNodes)];

    for (const child of sourceNodes) {
        const node = walkDom(child);
        if (node !== null) {
            nodes.push(node);
        }
    }

    return nodes;
}
