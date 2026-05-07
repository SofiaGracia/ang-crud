export type HtmlNodeType = 'element' | 'text';

export interface HtmlTextNode {
    type: 'text';
    content: string;
}

export interface HtmlElementNode {
    type: 'element';
    tag: string;
    attributes: Record<string, string>;
    children: HtmlNode[];
}

export type HtmlNode = HtmlTextNode | HtmlElementNode;
