import RouteBase from "../services/route.mjs";
import type { Subject } from "../types/contract.js";

export class ListSubjectsRoute extends RouteBase<Subject[], never> {
    async handle() {
        return this.success(await this.db.listSubjects());
    }
}
