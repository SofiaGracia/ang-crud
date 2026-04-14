import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-landing',
    imports: [RouterLink],
    templateUrl: './landing.html',
    styles: `
        :host {
            display: block;
        }
    `,
})
export default class Landing {}
