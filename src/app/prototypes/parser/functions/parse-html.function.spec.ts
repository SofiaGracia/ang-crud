import { parseHtml } from '@prototypes/parser/functions/parse-html.function';
import { walkDom } from '@prototypes/parser/functions/walk-dom.function';
import { isBlankText } from '@prototypes/parser/functions/is-blank-text.function';
import type { HtmlElementNode, HtmlTextNode } from '@prototypes/parser/interfaces/html-node.interface';

describe('HTML Parser', () => {
    describe('isBlankText', () => {
        it('returns true for empty string', () => {
            expect(isBlankText('')).toBe(true);
        });

        it('returns true for whitespace-only string', () => {
            expect(isBlankText('   ')).toBe(true);
        });

        it('returns true for newline-only string', () => {
            expect(isBlankText('\n\n')).toBe(true);
        });

        it('returns true for mixed whitespace', () => {
            expect(isBlankText('  \n  \t  ')).toBe(true);
        });

        it('returns false for text with content', () => {
            expect(isBlankText('Hello')).toBe(false);
        });

        it('returns false for text with surrounding whitespace', () => {
            expect(isBlankText('  Hello  ')).toBe(false);
        });
    });

    describe('parseHtml', () => {
        it('parses a simple div with class', () => {
            const result = parseHtml('<div class="card">Content</div>');

            expect(result).toHaveLength(1);
            const div = result[0] as HtmlElementNode;
            expect(div.type).toBe('element');
            expect(div.tag).toBe('div');
            expect(div.attributes).toEqual({ class: 'card' });
            expect(div.children).toHaveLength(1);

            const text = div.children![0] as HtmlTextNode;
            expect(text.type).toBe('text');
            expect(text.content).toBe('Content');
        });

        it('parses nested elements correctly', () => {
            const result = parseHtml('<div class="card"><h1>Hello</h1></div>');

            expect(result).toHaveLength(1);
            const div = result[0] as HtmlElementNode;
            expect(div.type).toBe('element');
            expect(div.tag).toBe('div');

            const h1 = div.children![0] as HtmlElementNode;
            expect(h1.type).toBe('element');
            expect(h1.tag).toBe('h1');

            const text = h1.children![0] as HtmlTextNode;
            expect(text.type).toBe('text');
            expect(text.content).toBe('Hello');
        });

        it('handles boolean attributes as "true"', () => {
            const result = parseHtml('<button disabled>Click</button>');

            const button = result[0] as HtmlElementNode;
            expect(button.attributes).toEqual({ disabled: 'true' });
        });

        it('handles boolean attributes with explicit empty value', () => {
            const result = parseHtml('<input disabled="" />');

            const input = result[0] as HtmlElementNode;
            expect(input.attributes).toEqual({ disabled: 'true' });
        });

        it('handles empty string values for non-boolean attributes', () => {
            const result = parseHtml('<input value="" />');

            const input = result[0] as HtmlElementNode;
            expect(input.attributes).toEqual({ value: '' });
        });

        it('handles event handler attributes as normal attributes', () => {
            const result = parseHtml('<button onclick="alert(\'hi\')">Click</button>');

            const button = result[0] as HtmlElementNode;
            expect(button.attributes).toEqual({ onclick: "alert('hi')" });
        });

        it('handles Angular-style event attributes as normal attributes', () => {
            const result = parseHtml('<button (click)="onClick()">Click</button>');

            const button = result[0] as HtmlElementNode;
            expect(button.attributes).toEqual({ '(click)': 'onClick()' });
        });

        it('handles Vue-style event attributes as normal attributes', () => {
            const result = parseHtml('<button @click="onClick">Click</button>');

            const button = result[0] as HtmlElementNode;
            expect(button.attributes).toEqual({ '@click': 'onClick' });
        });

        it('ignores whitespace-only text nodes', () => {
            const result = parseHtml('<div>   \n  </div>');

            const div = result[0] as HtmlElementNode;
            expect(div.children).toHaveLength(0);
        });

        it('filters whitespace between elements but preserves text content', () => {
            const result = parseHtml('<div>\n  <p>hi</p>\n</div>');

            const div = result[0] as HtmlElementNode;
            expect(div.children).toHaveLength(1);

            const p = div.children![0] as HtmlElementNode;
            expect(p.tag).toBe('p');

            const text = p.children![0] as HtmlTextNode;
            expect(text.content).toBe('hi');
        });

        it('handles template tags as normal elements', () => {
            const result = parseHtml('<template><span>inside</span></template>');

            expect(result).toHaveLength(1);
            const template = result[0] as HtmlElementNode;
            expect(template.tag).toBe('template');
            expect(template.children).toHaveLength(1);

            const span = template.children![0] as HtmlElementNode;
            expect(span.tag).toBe('span');
        });

        it('handles multiple root elements', () => {
            const result = parseHtml('<h1>A</h1><p>B</p>');

            expect(result).toHaveLength(2);

            const h1 = result[0] as HtmlElementNode;
            expect(h1.tag).toBe('h1');

            const p = result[1] as HtmlElementNode;
            expect(p.tag).toBe('p');
        });

        it('parses full HTML document with html as root', () => {
            const result = parseHtml('<!doctype html><html><head><title>Test</title></head><body><p>test</p></body></html>');

            expect(result).toHaveLength(1);

            const html = result[0] as HtmlElementNode;
            expect(html.type).toBe('element');
            expect(html.tag).toBe('html');
            expect(html.children).toHaveLength(2);

            const head = html.children![0] as HtmlElementNode;
            expect(head.tag).toBe('head');

            const title = head.children![0] as HtmlElementNode;
            expect(title.tag).toBe('title');
            expect(title.children![0]).toEqual({ type: 'text', content: 'Test' });

            const body = html.children![1] as HtmlElementNode;
            expect(body.tag).toBe('body');
            expect(body.children).toHaveLength(1);

            const p = body.children![0] as HtmlElementNode;
            expect(p.tag).toBe('p');
            expect(p.children![0]).toEqual({ type: 'text', content: 'test' });
        });

        it('parses full HTML document with only html tag', () => {
            const result = parseHtml('<html><body><span>content</span></body></html>');

            expect(result).toHaveLength(1);

            const html = result[0] as HtmlElementNode;
            expect(html.tag).toBe('html');

            const body = html.children!.find(
                (c) => c.type === 'element' && (c as HtmlElementNode).tag === 'body',
            ) as HtmlElementNode;

            expect(body).toBeDefined();

            const span = body.children![0] as HtmlElementNode;
            expect(span.tag).toBe('span');
            expect(span.children![0]).toEqual({ type: 'text', content: 'content' });
        });

        it('keeps style tag content as text node', () => {
            const result = parseHtml('<div><style>.foo { color: red; }</style></div>');

            const div = result[0] as HtmlElementNode;
            const style = div.children![0] as HtmlElementNode;
            expect(style.tag).toBe('style');
            expect(style.children).toHaveLength(1);
            expect(style.children![0]).toEqual({ type: 'text', content: '.foo { color: red; }' });
        });

        it('keeps script tag content as text node', () => {
            const result = parseHtml('<div><script>console.log("hi")</script></div>');

            const div = result[0] as HtmlElementNode;
            const script = div.children![0] as HtmlElementNode;
            expect(script.tag).toBe('script');
            expect(script.children).toHaveLength(1);
            expect(script.children![0]).toEqual({ type: 'text', content: 'console.log("hi")' });
        });

        it('handles element with no attributes', () => {
            const result = parseHtml('<span>text</span>');

            const span = result[0] as HtmlElementNode;
            expect(span.attributes).toEqual({});
        });

        it('handles multiple attributes', () => {
            const result = parseHtml(
                '<button class="btn primary" id="submit" type="submit">Go</button>',
            );

            const button = result[0] as HtmlElementNode;
            expect(button.attributes).toEqual({
                class: 'btn primary',
                id: 'submit',
                type: 'submit',
            });
        });

        it('handles deeply nested structures', () => {
            const html = '<div><ul><li><a href="/link"><span>Click</span></a></li></ul></div>';
            const result = parseHtml(html);

            const div = result[0] as HtmlElementNode;
            const ul = div.children![0] as HtmlElementNode;
            const li = ul.children![0] as HtmlElementNode;
            const a = li.children![0] as HtmlElementNode;
            const span = a.children![0] as HtmlElementNode;
            const text = span.children![0] as HtmlTextNode;

            expect(div.tag).toBe('div');
            expect(ul.tag).toBe('ul');
            expect(li.tag).toBe('li');
            expect(a.tag).toBe('a');
            expect(a.attributes).toEqual({ href: '/link' });
            expect(span.tag).toBe('span');
            expect(text.content).toBe('Click');
        });

        it('handles self-closing void elements', () => {
            const result = parseHtml('<img src="/photo.jpg" alt="Photo" />');

            expect(result).toHaveLength(1);
            const img = result[0] as HtmlElementNode;
            expect(img.tag).toBe('img');
            expect(img.attributes).toEqual({ src: '/photo.jpg', alt: 'Photo' });
            expect(img.children).toHaveLength(0);
        });

        it('handles mixed boolean and normal attributes', () => {
            const result = parseHtml('<input type="checkbox" checked disabled class="toggle" />');

            const input = result[0] as HtmlElementNode;
            expect(input.attributes).toEqual({
                type: 'checkbox',
                checked: 'true',
                disabled: 'true',
                class: 'toggle',
            });
        });

        it('handles form with required and readonly attributes', () => {
            const result = parseHtml('<input required readonly name="email" />');

            const input = result[0] as HtmlElementNode;
            expect(input.attributes).toEqual({
                required: 'true',
                readonly: 'true',
                name: 'email',
            });
        });
    });
});
