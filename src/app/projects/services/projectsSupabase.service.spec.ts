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
                    insert: vi.fn().mockReturnValue({
                        update: vi.fn().mockReturnValue({
                            delete: vi.fn().mockReturnValue({
                                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                            }),
                        }),
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
        it('should return array of projects', async () => {
            const mockProjects = [
                { id: 1, name: 'Project 1', description: 'Desc 1' },
                { id: 2, name: 'Project 2', description: 'Desc 2' },
            ];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
            });

            const projects = await service.getProjects().toPromise();
            expect(projects).toHaveLength(2);
            expect(projects![0].name).toBe('Project 1');
        });

        it('should return empty array when no data', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: null, error: null }),
            });

            const projects = await service.getProjects().toPromise();
            expect(projects).toEqual([]);
        });

        it('should validate contract on returned data', async () => {
            const mockProjects = [{ id: 1, name: 'Project 1', description: 'Desc 1' }];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
            });

            const projects = await service.getProjects().toPromise();
            projects!.forEach((p) => expect(validateProjectContract(p)).toBe(true));
        });
    });

    describe('getProjectByName', () => {
        it('should return project by name', async () => {
            const mockProject = { id: 1, name: 'Project 1', description: 'Desc 1' };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectByName('Project 1').toPromise();
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

            const project = await service.getProjectByName('NonExistent').toPromise();
            expect(project).toBeNull();
        });
    });

    describe('getProjectById', () => {
        it('should return project by id', async () => {
            const mockProject = { id: 1, name: 'Project 1', description: 'Desc 1' };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
                    }),
                }),
            });

            const project = await service.getProjectById(1).toPromise();
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

            const project = await service.getProjectById(1).toPromise();
            if (project) expect(validateProjectContract(project)).toBe(true);
        });
    });

    describe('addProject', () => {
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

            const project = await service.addProject(newProject as any).toPromise();
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

            await expect(service.addProject(newProject as any).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Insert failed' })
            );
        });
    });

    describe('removeProject', () => {
        it('should delete project without returning data', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.removeProject(1).toPromise();
        });

        it('should throw error when deletion fails', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Delete failed' },
                    }),
                }),
            });

            await expect(service.removeProject(1).toPromise()).rejects.toEqual(
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