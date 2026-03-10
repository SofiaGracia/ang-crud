
// Valorar escalar ProjectResponse:
// export interface ProductResponse {
//     count:    number;
//     pages:    number;
//     products: Product[];
// }

// export interface ProjectResponse {
//     projects: Project[];
// }

export interface Project {
    id:          string;
    name:        string;
    tools:       string[];
    url:         string;
    projectId:   number;
    description: string;
}
