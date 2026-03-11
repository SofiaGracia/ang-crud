import { Component, input } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCard {
    project = input.required<ProjectInterface>();

}
