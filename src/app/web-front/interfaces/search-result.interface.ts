import { ProjectInterface } from '@projects/interfaces/project.interface';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';

export type SearchResultItem = 
  | ({ type: 'project' } & ProjectInterface)
  | ({ type: 'prototype' } & PrototypeInterface);

export type SearchResults = SearchResultItem[] | null;