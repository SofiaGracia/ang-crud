import { TestBed } from '@angular/core/testing';
import { ProjectSupabaseService } from './projectsSupabase.service';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { validateProjectContract } from '@shared/utils/contract.utils';

describe('ProjectSupabaseService', () => {
    let service: ProjectSupabaseService;
    let mockSupabase: any;

    beforeEach(async () => {
        const selectSpy = vi.fn();
        const eqSpy = vi.fn();
        const isSpy = vi.fn();
        const maybeSingleSpy = vi.fn();
        const insertSelectSpy = vi.fn();
        const updateEqSpy = vi.fn();
        const deleteEqSpy = vi.fn();
        const notOrderSpy = vi.fn();
        const orderSpy = vi.fn();

        selectSpy.mockReturnValue({
            eq: eqSpy,
            is: isSpy,
            maybeSingle: maybeSingleSpy,
            insert: vi.fn().mockReturnValue({
                select: insertSelectSpy,
                update: vi.fn().mockReturnValue({ eq: updateEqSpy }),
                delete: vi.fn().mockReturnValue({ eq: deleteEqSpy }),
            }),
            not: vi.fn().mockReturnValue({ order: notOrderSpy }),
        });

        eqSpy.mockReturnValue({
            is: isSpy,
            maybeSingle: maybeSingleSpy,
        });

        isSpy.mockReturnValue({ data: [], error: null });
        maybeSingleSpy.mockReturnValue({ data: null, error: null });
        orderSpy.mockReturnValue({ data: [], error: null });
        notOrderSpy.mockReturnValue({ data: [], error: null });
        insertSelectSpy.mockReturnValue({ data: null, error: null });
        updateEqSpy.mockReturnValue({ data: null, error: null });
        deleteEqSpy.mockReturnValue({ data: null, error: null });

        mockSupabase = {
            from: vi.fn().mockReturnValue({
                select: selectSpy,
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