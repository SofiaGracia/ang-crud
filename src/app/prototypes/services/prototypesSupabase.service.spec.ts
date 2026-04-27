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

});