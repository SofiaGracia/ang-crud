import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faLayerGroup, faCode, faPalette, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

interface Feature {
    icon: typeof faLayerGroup;
    title: string;
    description: string;
}

@Component({
    selector: 'app-landing',
    imports: [RouterLink, FaIconComponent],
    templateUrl: './landing.html',
})
export default class Landing {
    faLayerGroup = faLayerGroup;
    faCode = faCode;
    faPalette = faPalette;
    faCloudArrowUp = faCloudArrowUp;

    features: Feature[] = [
        {
            icon: faLayerGroup,
            title: 'Organize Projects',
            description: 'Create and manage multiple projects to keep your prototypes organized.',
        },
        {
            icon: faCode,
            title: 'Upload HTML',
            description: 'Simply upload your HTML files and preview them instantly in your browser.',
        },
        {
            icon: faPalette,
            title: 'Live Preview',
            description: 'See your designs come to life with real-time preview in iframes.',
        },
        {
            icon: faCloudArrowUp,
            title: 'Cloud Storage',
            description: 'Your prototypes are safely stored in the cloud and accessible anywhere.',
        },
    ];
}
