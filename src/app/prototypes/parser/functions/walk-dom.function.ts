import { BOOLEAN_ATTRIBUTES } from '@prototypes/parser/constants/boolean-attributes.constant';
import { isBlankText } from '@prototypes/parser/functions/is-blank-text.function';
import { HtmlNode } from '@prototypes/parser/interfaces/html-node.interface';

export function walkDom(domNode: Node): HtmlNode | null {
    if (domNode.nodeType === Node.TEXT_NODE) {
        const content = domNode.textContent ?? '';
        if (isBlankText(content)) return null;
        return { type: 'text', content };
    }

    if (domNode.nodeType === Node.ELEMENT_NODE) {
        const element = domNode as Element;
        const children: HtmlNode[] = [];

        const childNodes =
            element instanceof HTMLTemplateElement
                ? Array.from(element.content.childNodes)
                : Array.from(element.childNodes);

        for (const child of childNodes) {
            const node = walkDom(child);
            if (node !== null) {
                children.push(node);
            }
        }

        const attributes: Record<string, string> = {};
        for (const attr of Array.from(element.attributes)) {
            if (BOOLEAN_ATTRIBUTES.has(attr.name) && attr.value === '') {
                attributes[attr.name] = 'true';
            } else {
                attributes[attr.name] = attr.value;
            }
        }

        return {
            type: 'element',
            tag: element.tagName.toLowerCase(),
            attributes,
            children,
        };
    }

    return null;
}
