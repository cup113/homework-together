import RouteBase from "../services/route.mjs";
import type { SubjectsRecord } from "../types/pocketbase-types.js";

export class ListSubjectsRoute extends RouteBase<SubjectsRecord[], never> {
    async handle() {
        return this.success(await this.db.listSubjects());
    }
}
