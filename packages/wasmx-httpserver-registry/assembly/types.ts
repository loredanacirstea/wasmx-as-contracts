import { JSON } from "json-as";

export const MODULE_NAME = "httpserver-registry"

@json
export class SetRouteRequest {
    route: string = ""
    constructor(route: string) {
        this.route = route
    }
}
