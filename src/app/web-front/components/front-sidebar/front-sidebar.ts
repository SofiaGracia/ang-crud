import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { SIDEMENUOPTIONS } from '@web-front/constants/sidebar-options.constant';

@Component({
    selector: 'front-sidebar',
    imports: [FaIconComponent, RouterLink],
    templateUrl: './front-sidebar.html',
    styles: `
        .sidebar {
            width: 250px;
            height: 100%;
            background: #1f2937;
            color: white;
            transition: width 0.3s;
            padding: 1rem;
            overflow: hidden; /* importante: que no scrollee */
            flex-shrink: 0;
        }

        .sidebar.collapsed {
            width: 70px;
        }
    `,
})
export class FrontSidebar {
    sidebarOptions = SIDEMENUOPTIONS;

    faBars = faBars;
    faTimes = faTimes;

    collapsed = false;

    toggle() {
        this.collapsed = !this.collapsed;
    }
}
