import { Component, input } from '@angular/core';
import { Project } from '@projects/interfaces/project-response.interface';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCard {
    project = input.required<Project>();

}
