import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faHouse, faFile, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { provideHttpClient, withFetch } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(FontAwesomeModule),
    {
        provide: FaIconLibrary,
        useFactory: () => {
            const lib = new FaIconLibrary();
            lib.addIcons(faHouse, faFile);
            return lib
        }
    }
  ]
};
