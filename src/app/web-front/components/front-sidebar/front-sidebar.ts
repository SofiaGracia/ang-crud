import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faTimes, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
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
            overflow: hidden;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }

        .sidebar.collapsed {
            width: 70px;
        }

        .nav-links {
            flex: 0;
        }

        .logout-btn {
            border-top: 1px solid #374151;
            padding-top: 1rem;
            margin-top: auto;
        }
    `,
})
export class FrontSidebar {
    @Output() signOut = new EventEmitter<void>();

    sidebarOptions = SIDEMENUOPTIONS;

    faBars = faBars;
    faTimes = faTimes;
    faRightFromBracket = faRightFromBracket;

    collapsed = false;

    toggle() {
        this.collapsed = !this.collapsed;
    }

    onSignOut(): void {
        this.signOut.emit();
    }
}
