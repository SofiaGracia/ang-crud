import { TestBed } from '@angular/core/testing';
import { PrototypesFacade } from './prototypes.facades';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { AuthFacade } from '@auth/facades/auth.facade';
import { firstValueFrom, of } from 'rxjs';

describe('PrototypesFacade', () => {
    let facade: PrototypesFacade;
    let mockService: any;

    beforeEach(async () => {
        mockService = {
            getPrototypesByProject: vi.fn().mockReturnValue(of([])),
            getPrototypesPaginated: vi.fn().mockReturnValue(of({ data: [], total: 0, page: 1, limit: 8, totalPages: 0 })),
            addPrototype: vi.fn().mockReturnValue(of({ id: 1, name: 'Test' })),
            moveToTrash: vi.fn().mockReturnValue(of(undefined)),
            getPrototypeById: vi.fn().mockReturnValue(of(null)),
            searchPrototypesByName: vi.fn().mockReturnValue(of([])),
        };

        await TestBed.configureTestingModule({
            providers: [
                PrototypesFacade,
                { provide: PrototypesSupabaseService, useValue: mockService },
                { provide: AuthFacade, useValue: { currentUserId: 'test-user-id' } },
            ],
        });

        facade = TestBed.inject(PrototypesFacade);
    });

    describe('loadPrototypes', () => {
        // it('should emit prototypes from service', async () => {
        //     const mockPrototypes = [
        //         { id: 1, name: 'Prototype 1', project_id: 1 },
        //     ];
        //     mockService.getPrototypesByProject.mockReturnValue(of(mockPrototypes));

        //     facade.loadPrototypes(1);
        //     const prototypes = await firstValueFrom(facade.prototypes$);

        //     expect(prototypes).toHaveLength(1);
        //     expect(prototypes[0].name).toBe('Prototype 1');
        // });

        it('should not call service when projectId is null', () => {
            mockService.getPrototypesByProject.mockReturnValue(of([]));
            facade.loadPrototypes(null as any);
            expect(mockService.getPrototypesByProject).not.toHaveBeenCalled();
        });
    });
});
