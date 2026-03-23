import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Projects } from './projects';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { firstValueFrom, of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { provideRouter } from '@angular/router';

@Component({
    selector: 'project-card',
    standalone: true,
    template: '<div></div>',
})
class MockProjectCard {
    @Input() project: any;
}

@Component({
    selector: 'dialog-cm-project',
    standalone: true,
    template: '<div></div>',
})
class MockDialogCMProject {}

describe('Projects', () => {
    let component: Projects;
    let fixture: ComponentFixture<Projects>;
    let mockFacade: any;

    beforeEach(async () => {
        mockFacade = {
            projects$: of([
                { id: 1, name: 'Project 1', description: 'Description 1' },
                { id: 2, name: 'Project 2', description: 'Description 2' },
            ]),
            loadProjects: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [
                Projects,
                MockProjectCard,
                MockDialogCMProject,
            ],
            providers: [
                { provide: ProjectsFacade, useValue: mockFacade },
                provideRouter([]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Projects);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should expose projects$ from facade', async () => {
        const projects = await firstValueFrom(component.projects$);
        expect(projects).toHaveLength(2);
    });

    it('should render project cards', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const cards = compiled.querySelectorAll('project-card');
        expect(cards).toHaveLength(2);
    });
});