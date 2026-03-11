
// Valorar escalar ProjectResponse:
// export interface ProductResponse {
//     count:    number;
//     pages:    number;
//     products: Product[];
// }

// export interface ProjectResponse {
//     projects: Project[];
// }

export interface ProjectInterface {
    id:          number;
    name:        string;
    description: string | null;
}
