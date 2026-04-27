import { TestBed } from '@angular/core/testing';
import { ProjectSupabaseService } from './projectsSupabase.service';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { validateProjectContract } from '@shared/utils/contract.utils';

describe('ProjectSupabaseService', () => {
    let service: ProjectSupabaseService;
    let mockSupabase: any;

    beforeEach(async () => {
        mockSupabase = {
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: [], error: null }),
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                    is: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                        update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                    }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    not: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            }),
        };

        await TestBed.configureTestingModule({
            providers: [
                ProjectSupabaseService,
                { provide: SupabaseClientService, useValue: { instance: mockSupabase } },
            ],
        });

        service = TestBed.inject(ProjectSupabaseService);
    });

    describe('getProjects', () => {
        const mockUserId = 'mock-user-id';

        it('should return array of projects', async () => {
            const mockProjects = [
                { id: 1, name: 'Project 1', description: 'Desc 1' },
                { id: 2, name: 'Project 2', description: 'Desc 2' },
            ];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
                }),
            });

            const projects = await service.getProjects(mockUserId).toPromise();
            expect(projects).toHaveLength(2);
            expect(projects![0].name).toBe('Project 1');
        });

        it('should return empty array when no data', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            const projects = await service.getProjects(mockUserId).toPromise();
            expect(projects).toEqual([]);
        });

        it('should validate contract on returned data', async () => {
            const mockProjects = [{ id: 1, name: 'Project 1', description: 'Desc 1' }];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
                }),
            });

            const projects = await service.getProjects(mockUserId).toPromise();
            projects!.forEach((p) => expect(validateProjectContract(p)).toBe(true));
        });
    });

    describe('getProjectByName', () => {
        const mockUserId = 'mock-user-id';

        it('should return project by name', async () => {
            const mockProject = { id: 1, name: 'Project 1', description: 'Desc 1' };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectByName('Project 1', mockUserId).toPromise();
            expect(project?.name).toBe('Project 1');
        });

        it('should return null when not found', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectByName('NonExistent', mockUserId).toPromise();
            expect(project).toBeNull();
        });
    });

    describe('getProjectById', () => {
        const mockUserId = 'mock-user-id';

        it('should return project by id', async () => {
            const mockProject = { id: 1, name: 'Project 1', description: 'Desc 1' };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectById(1, mockUserId).toPromise();
            expect(project?.id).toBe(1);
        });

        it('should validate contract on returned project', async () => {
            const mockProject = { id: 1, name: 'Project 1', description: 'Desc 1' };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectById(1, mockUserId).toPromise();
            if (project) expect(validateProjectContract(project)).toBe(true);
        });
    });

    describe('addProject', () => {
        const mockUserId = 'mock-user-id';

        it('should create project and return created data', async () => {
            const newProject = { name: 'New Project', description: 'New desc' };
            const createdProject = { id: 1, ...newProject };

            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: createdProject, error: null }),
                    }),
                }),
            });

            const project = await service.addProject(newProject as any, mockUserId).toPromise();
            expect(project!.id).toBe(1);
            expect(project!.name).toBe('New Project');
            expect(mockSupabase.from).toHaveBeenCalledWith('projects');
        });

        it('should throw error when Supabase returns error', async () => {
            const newProject = { name: 'New Project', description: 'New desc' };

            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Insert failed' },
                        }),
                    }),
                }),
            });

            await expect(service.addProject(newProject as any, mockUserId).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Insert failed' })
            );
        });
    });

    describe('moveToTrash', () => {
        it('should soft delete project by setting deleted_at', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.moveToTrash(1).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('projects');
        });

        it('should throw error when soft delete fails', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Delete failed' },
                    }),
                }),
            });

            await expect(service.moveToTrash(1).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Delete failed' })
            );
        });
    });

    describe('permanentDeleteProject', () => {
        it('should permanently delete project', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.permanentDeleteProject(1).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('projects');
        });

        it('should throw error when permanent delete fails', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Delete failed' },
                    }),
                }),
            });

            await expect(service.permanentDeleteProject(1).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Delete failed' })
            );
        });
    });

    describe('updateProject', () => {
        it('should update project', async () => {
            const updates = { name: 'Updated Name' };

            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.updateProject(1, updates as any).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('projects');
        });

        it('should throw error when update fails', async () => {
            const updates = { name: 'Updated Name' };

            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Update failed' },
                    }),
                }),
            });

            await expect(service.updateProject(1, updates as any).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Update failed' })
            );
        });
    });
});