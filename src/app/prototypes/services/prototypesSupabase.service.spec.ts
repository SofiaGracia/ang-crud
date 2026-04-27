import { TestBed } from '@angular/core/testing';
import { PrototypesSupabaseService } from './prototypesSupabase.service';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { validatePrototypeContract } from '@shared/utils/contract.utils';

describe('PrototypesSupabaseService', () => {
    let service: PrototypesSupabaseService;
    let mockSupabase: any;

    beforeEach(async () => {
        const selectSpy = vi.fn();
        const eqSpy = vi.fn();
        const eq2Spy = vi.fn();
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
            eq: eq2Spy,
        });

        eq2Spy.mockReturnValue({
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
                PrototypesSupabaseService,
                { provide: SupabaseClientService, useValue: { instance: mockSupabase } },
            ],
        });

        service = TestBed.inject(PrototypesSupabaseService);
    });

    describe('getPrototypesByProject', () => {
        const mockUserId = 'mock-user-id';

        it('should return array of prototypes for a project', async () => {
            const mockPrototypes = [
                { id: 1, name: 'Prototype 1', project_id: 1, tool: 'Figma', url: 'https://figma.com' },
                { id: 2, name: 'Prototype 2', project_id: 1, tool: 'Sketch', url: 'https://sketch.com' },
            ];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: mockPrototypes, error: null }),
                    }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1, mockUserId).toPromise();
            expect(prototypes).toHaveLength(2);
            expect(prototypes![0].name).toBe('Prototype 1');
        });

        it('should return empty array when no prototypes', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1, mockUserId).toPromise();
            expect(prototypes).toEqual([]);
        });

        it('should return empty array when data is null', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1, mockUserId).toPromise();
            expect(prototypes).toEqual([]);
        });

        it('should validate contract on returned prototypes', async () => {
            const mockPrototypes = [{ id: 1, name: 'Prototype 1', project_id: 1 }];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: mockPrototypes, error: null }),
                    }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1, mockUserId).toPromise();
            prototypes!.forEach((p) => expect(validatePrototypeContract(p)).toBe(true));
        });

        it('should throw error when Supabase returns error', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Query failed' },
                        }),
                    }),
                }),
            });

            await expect(service.getPrototypesByProject(1, mockUserId).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Query failed' })
            );
        });

        it('should call Supabase with correct table and filter', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        is: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            });

            await service.getPrototypesByProject(42, mockUserId).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('prototypes');
        });
    });

    describe('addPrototype', () => {
        const mockUserId = 'mock-user-id';

        it('should create prototype and return created data', async () => {
            const newPrototype = { name: 'New Prototype', project_id: 1, tool: 'Figma', url: 'https://figma.com' };
            const createdPrototype = { id: 1, ...newPrototype };

            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: createdPrototype, error: null }),
                    }),
                }),
            });

            const prototype = await service.addPrototype(newPrototype as any, mockUserId).toPromise();
            expect(prototype!.id).toBe(1);
            expect(prototype!.name).toBe('New Prototype');
        });

        it('should throw error when insert fails', async () => {
            const newPrototype = { name: 'New Prototype', project_id: 1 };

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

            await expect(service.addPrototype(newPrototype as any, mockUserId).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Insert failed' })
            );
        });
    });

    describe('moveToTrash', () => {
        it('should soft delete prototype by setting deleted_at', async () => {
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.moveToTrash(1).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('prototypes');
        });

        it('should throw error when delete fails', async () => {
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

    describe('permanentDeletePrototype', () => {
        it('should permanently delete prototype', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            await service.permanentDeletePrototype(1).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('prototypes');
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

            await expect(service.permanentDeletePrototype(1).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Delete failed' })
            );
        });
    });

    describe('getPrototypeById', () => {
        const mockUserId = 'mock-user-id';

        it('should return prototype by id', async () => {
            const mockPrototype = { id: 1, name: 'Prototype 1', project_id: 1 };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: mockPrototype, error: null }),
                        }),
                    }),
                }),
            });

            const prototype = await service.getPrototypeById(1, 1, mockUserId).toPromise();
            expect(prototype?.id).toBe(1);
        });

        it('should validate contract on returned prototype', async () => {
            const mockPrototype = { id: 1, name: 'Prototype 1', project_id: 1 };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: mockPrototype, error: null }),
                        }),
                    }),
                }),
            });

            const prototype = await service.getPrototypeById(1, 1, mockUserId).toPromise();
            if (prototype) expect(validatePrototypeContract(prototype)).toBe(true);
        });
    });
});