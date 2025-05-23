export class ParsedUrl {
    constructor(
        public basePath: string = "",
        public routeParams: Map<string, string> = new Map(),
        public queryParams: Map<string, string> = new Map()
    ) {}
}

export function parseUrl(actualUrl: string, pathTemplate: string): ParsedUrl {
    const urlParts = actualUrl.split("?");
    const path = urlParts[0];
    const query = urlParts.length > 1 ? urlParts[1] : "";

    const pathSegments = path.split("/").filter(s => s.length > 0);
    const templateSegments = pathTemplate.split("/").filter(s => s.length > 0);

    const routeParams = new Map<string, string>();
    const baseParts: string[] = [];

    for (let i = 0; i < templateSegments.length; i++) {
        const tplSeg = templateSegments[i];
        if (tplSeg.startsWith("{") && tplSeg.endsWith("}")) {
            const key = tplSeg.slice(1, tplSeg.length - 1);
            const value = i < pathSegments.length ? pathSegments[i] : "";
            routeParams.set(key, value);
        } else {
            baseParts.push(tplSeg);
        }
    }

    const basePath = "/" + baseParts.join("/");

    const queryParams = new Map<string, string>();
    const pairs = query.split("&");
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        if (pair.length == 0) continue;
        const eqIndex = pair.indexOf("=");
        if (eqIndex > -1) {
            const key = decodeURIComponent(pair.substring(0, eqIndex));
            const value = decodeURIComponent(pair.substring(eqIndex + 1));
            queryParams.set(key, value);
        } else {
            queryParams.set(decodeURIComponent(pair), "");
        }
    }

    return new ParsedUrl(basePath, routeParams, queryParams);
}
