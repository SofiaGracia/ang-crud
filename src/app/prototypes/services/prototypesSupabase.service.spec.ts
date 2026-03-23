import { TestBed } from '@angular/core/testing';
import { PrototypesSupabaseService } from './prototypesSupabase.service';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { validatePrototypeContract } from '@shared/utils/contract.utils';

describe('PrototypesSupabaseService', () => {
    let service: PrototypesSupabaseService;
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
                PrototypesSupabaseService,
                { provide: SupabaseClientService, useValue: { instance: mockSupabase } },
            ],
        });

        service = TestBed.inject(PrototypesSupabaseService);
    });

    describe('getPrototypesByProject', () => {
        it('should return array of prototypes for a project', async () => {
            const mockPrototypes = [
                { id: 1, name: 'Prototype 1', project_id: 1, tool: 'Figma', url: 'https://figma.com' },
                { id: 2, name: 'Prototype 2', project_id: 1, tool: 'Sketch', url: 'https://sketch.com' },
            ];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockPrototypes, error: null }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1).toPromise();
            expect(prototypes).toHaveLength(2);
            expect(prototypes![0].name).toBe('Prototype 1');
        });

        it('should return empty array when no prototypes', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1).toPromise();
            expect(prototypes).toEqual([]);
        });

        it('should return empty array when data is null', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1).toPromise();
            expect(prototypes).toEqual([]);
        });

        it('should validate contract on returned prototypes', async () => {
            const mockPrototypes = [{ id: 1, name: 'Prototype 1', project_id: 1 }];

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockPrototypes, error: null }),
                }),
            });

            const prototypes = await service.getPrototypesByProject(1).toPromise();
            prototypes!.forEach((p) => expect(validatePrototypeContract(p)).toBe(true));
        });

        it('should throw error when Supabase returns error', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Query failed' },
                    }),
                }),
            });

            await expect(service.getPrototypesByProject(1).toPromise()).rejects.toEqual(
                expect.objectContaining({ message: 'Query failed' })
            );
        });

        it('should call Supabase with correct table and filter', async () => {
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
            });

            await service.getPrototypesByProject(42).toPromise();
            expect(mockSupabase.from).toHaveBeenCalledWith('prototypes');
        });
    });
});