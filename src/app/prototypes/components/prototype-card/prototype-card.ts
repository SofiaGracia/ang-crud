import { Component, input } from '@angular/core';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';

@Component({
  selector: 'prototype-card',
  imports: [],
  templateUrl: './prototype-card.html',
})
export class PrototypeCard {
    proto = input.required<PrototypeInterface>();
}
