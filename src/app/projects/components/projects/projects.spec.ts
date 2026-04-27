import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Projects } from './projects';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { firstValueFrom, of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'project-card',
    standalone: true,
    template: '<div></div>',
})
class MockProjectCard {
    @Input() project: any;
}

@Component({
    selector: 'dialog-project',
    standalone: true,
    template: '<div></div>',
})
class MockDialogProject {}

@Component({
    selector: 'search-input',
    standalone: true,
    template: '<div></div>',
    imports: [],
})
class MockSearchInput {}

@Component({
    selector: 'pagination',
    standalone: true,
    template: '<div></div>',
    imports: [],
})
class MockPagination {}

describe('Projects', () => {
    let component: Projects;
    let fixture: ComponentFixture<Projects>;
    let mockFacade: any;

    beforeEach(async () => {
        mockFacade = {
            userId: 'mock-user-id',
            projects$: of([
                { id: 1, name: 'Project 1', description: 'Description 1' },
                { id: 2, name: 'Project 2', description: 'Description 2' },
            ]),
            paginatedProjects$: of({
                data: [
                    { id: 1, name: 'Project 1', description: 'Description 1' },
                    { id: 2, name: 'Project 2', description: 'Description 2' },
                ],
                total: 2,
                page: 1,
                limit: 8,
                totalPages: 1,
            }),
            totalPages$: of(1),
            currentPage$: of(1),
            totalCount$: of(2),
            loadProjects: vi.fn(),
            goToPage: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [
                Projects,
                MockProjectCard,
                MockDialogProject,
                MockSearchInput,
                MockPagination,
                AsyncPipe,
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

    it('should expose paginatedData$ from facade', async () => {
        const paginated = await firstValueFrom(component.paginatedData$);
        expect(paginated?.data).toHaveLength(2);
    });

    it('should render paginated project cards', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const cards = compiled.querySelectorAll('project-card');
        expect(cards).toHaveLength(2);
    });

    it('should call goToPage when onPageChange is called', () => {
        component.onPageChange(2);
        expect(mockFacade.goToPage).toHaveBeenCalledWith(2);
    });
});
