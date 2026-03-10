import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontSidebar } from '@web-front/components/front-sidebar/front-sidebar';

@Component({
    selector: 'app-web-front-layout',
    imports: [RouterOutlet, FrontSidebar],
    templateUrl: './web-front-layout.html',
    styles: `
        .layout {
            display: flex;
            height: 100vh;
        }

        .content {
            flex: 1;
            padding: 2rem;
        }
    `,
})
export default class WebFrontLayout {}
