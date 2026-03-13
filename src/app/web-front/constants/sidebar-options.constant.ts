import { SidebarOption } from '@web-front/interfaces/sidebar-option.interface';

export const SIDEMENUOPTIONS: SidebarOption[] = [
    {
        title: 'Home',
        icon: 'house',
        route: '/projects',
    },{
        title: 'Recent',
        icon: 'file',
        route: '/projects/recent',
    },
    // {
    //     title: 'Trash',
    //     icon: 'trash',
    //     route: '/projects/trash',
    // }
];
