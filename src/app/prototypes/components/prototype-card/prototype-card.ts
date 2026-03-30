import { Component, inject, input } from '@angular/core';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';


@Component({
  selector: 'prototype-card',
  imports: [FaIconComponent],
  templateUrl: './prototype-card.html',
})
export class PrototypeCard {
    proto = input.required<PrototypeInterface>();
    private prototypesFacade = inject(PrototypesFacade);

    faEllipsis = faEllipsis;

    deleteProto(event: MouseEvent, id: number, projectId: number){
        event.stopPropagation();
        this.prototypesFacade.removeProto(id, projectId);
        console.log('Prototype removed')
    }

}
