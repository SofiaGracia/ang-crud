import { TestBed } from '@angular/core/testing';
import { ProjectsFacade } from './projects.facade';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { AuthFacade } from '@auth/facades/auth.facade';
import { firstValueFrom, of } from 'rxjs';

describe('ProjectsFacade', () => {
    let facade: ProjectsFacade;
    let mockService: any;

    beforeEach(async () => {
        mockService = {
            getProjects: vi.fn().mockReturnValue(of([])),
            getProjectsPaginated: vi.fn().mockReturnValue(of({ data: [], total: 0, page: 1, limit: 8, totalPages: 0 })),
            getProjectById: vi.fn().mockReturnValue(of(null)),
            addProject: vi.fn().mockReturnValue(of({ id: 1, name: 'Test' })),
            moveToTrash: vi.fn().mockReturnValue(of(undefined)),
            updateProject: vi.fn().mockReturnValue(of(undefined)),
            searchProjectsByName: vi.fn().mockReturnValue(of([])),
        };

        await TestBed.configureTestingModule({
            providers: [
                ProjectsFacade,
                { provide: ProjectSupabaseService, useValue: mockService },
                { provide: AuthFacade, useValue: { currentUserId: 'test-user-id', currentUser$: of({ id: 'test-user-id' }) } },
            ],
        });

        facade = TestBed.inject(ProjectsFacade);
    });

    describe('projects$', () => {
        it('should expose projects observable', async () => {
            facade.loadProjects();
            const projects = await firstValueFrom(facade.projects$);
            expect(Array.isArray(projects)).toBe(true);
        });
    });

    describe('project$', () => {
        it('should expose selected project observable', async () => {
            mockService.getProjectById.mockReturnValue(of({ id: 1, name: 'Test', description: 'Desc' }));
            facade.loadProject(1);
            const project = await firstValueFrom(facade.project$);
            expect(project).toBeDefined();
        });
    });

    describe('addProject', () => {
        it('should call addProject on service', () => {
            facade.addProject({ name: 'New Project', description: 'Desc' } as any);
            expect(mockService.addProject).toHaveBeenCalledWith(
                { name: 'New Project', description: 'Desc' },
                'test-user-id'
            );
        });
    });

    describe('removeProject', () => {
        it('should call moveToTrash on service when removeProject is called', () => {
            facade.removeProject(1);
            expect(mockService.moveToTrash).toHaveBeenCalledWith(1);
        });
    });

    describe('updateProject', () => {
        it('should call updateProject on service', () => {
            facade.updateProject(1, { name: 'Updated' } as any);
            expect(mockService.updateProject).toHaveBeenCalledWith(1, { name: 'Updated' });
        });
    });
});