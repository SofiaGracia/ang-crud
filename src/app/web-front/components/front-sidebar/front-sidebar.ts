import { AsyncPipe } from '@angular/common';
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@auth/facades/auth.facade';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faRightFromBracket, faUserAlt, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { SIDEMENUOPTIONS } from '@web-front/constants/sidebar-options.constant';

@Component({
    selector: 'front-sidebar',
    imports: [FaIconComponent, RouterLink, AsyncPipe],
    templateUrl: './front-sidebar.html',
    styles: `
        .sidebar {
            width: 250px;
            height: 100%;
            background: #1f2937;
            color: white;
            transition: width 0.3s;
            padding: 1rem;
            overflow: visible;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        }

        .sidebar.collapsed {
            width: 70px;
            min-width: 70px;
            z-index: 40;
        }

        .nav-links {
            flex: 0;
        }

        .profile-btn {
            border-top: 1px solid #374151;
            padding-top: 1rem;
            margin-top: auto;
        }

        .dropdown-content {
            position: absolute;
            z-index: 9999
        }

        .email-text {
            text-overflow: ellipsis;
            max-width: 15ch;
        }
    `,
})
export class FrontSidebar {
    @Output() signOut = new EventEmitter<void>();

    sidebarOptions = SIDEMENUOPTIONS;
    authFacade = inject(AuthFacade);

    user$ = this.authFacade.currentUser$;

    faBars = faBars;
    faRightFromBracket = faRightFromBracket;
    faUser = faUserAlt;
    faMoon = faMoon;
    faSun = faSun;

    collapsed = false;

    toggle() {
        this.collapsed = !this.collapsed;
    }

    onSignOut(): void {
        this.signOut.emit();
    }

    onChangeTheme(): void {
        console.log('cambiar de tema')
    }
}
