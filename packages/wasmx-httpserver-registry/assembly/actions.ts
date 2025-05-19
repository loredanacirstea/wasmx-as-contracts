import { JSON } from "json-as";
import * as config from "wasmx-dtype/assembly/config";
import { DTypeSdk } from "wasmx-dtype/assembly/sdk";
import * as httpsw from "wasmx-env-httpserver/assembly/httpserver_wrap";
import { GetRouteRequest, GetRouteResponse, GetRoutesRequest, GetRoutesResponse, MODULE_NAME, RemoveRouteRequest, RouteToRead, SetRouteRequest, TableIds } from "./types";
import { LoggerDebug, LoggerDebugExtended, LoggerError, LoggerInfo, revert } from "./utils";
import { getTableFieldsRegistry, TableNameRegistry, Tables } from "./defs";
import { getTableIds, setTableIds } from "./storage";
import { CloseResponse, HttpRequestIncoming, HttpResponse, HttpResponseWrap, RemoveRouteHandlerRequest, SetRouteHandlerRequest, StartWebServerRequest, StartWebServerResponse, WebsrvConfig } from "wasmx-env-httpserver/assembly/types";
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { callContract } from "wasmx-env/assembly/utils";

export function Initialize(): ArrayBuffer {
    const dtype = getDtypeSdk();
    const ids = dtype.Insert(config.tableTableId, config.DTypeTableName, Tables)
    const tableIds = new TableIds(ids[0])
    setTableIds(tableIds)
    const fields = getTableFieldsRegistry(tableIds.registry)
    dtype.Insert(config.tableFieldsId, config.DTypeFieldName, fields)
    dtype.CreateTable(tableIds.registry)

    return new ArrayBuffer(0)
}

export function StartWebServer(req: StartWebServerRequest): ArrayBuffer {
    const routes = getRoutesInternal()
    const r = new Map<string,string>()
    for (let i = 0; i < routes.length; i++) {
        r.set(routes[i].route, routes[i].contract_address)
    }
    req.config.route_to_contract_address = r
    const resp = httpsw.StartWebServer(req)
    return String.UTF8.encode(JSON.stringify<StartWebServerResponse>(resp))
}

export function Close(): ArrayBuffer {
    const resp = httpsw.Close()
    return String.UTF8.encode(JSON.stringify<CloseResponse>(resp))
}

export function GetRoutes(req: GetRoutesRequest): ArrayBuffer {
    const resp = getRoutesInternal()
    const r = new Map<string,string>()
    for (let i = 0; i < resp.length; i++) {
        r.set(resp[i].route, resp[i].contract_address)
    }
    return String.UTF8.encode(JSON.stringify<GetRoutesResponse>(new GetRoutesResponse(r)))
}

export function GetRoute(req: GetRouteRequest): ArrayBuffer {
    const dtype = getDtypeSdk();
    const ids = getTableIds();
    const cond = `{"route":"${req.route}"}`;
    const resp = dtype.Read(ids.registry, TableNameRegistry, cond);
    return String.UTF8.encode(resp)
}

export function SetRoute(req: SetRouteRequest): ArrayBuffer {
    const dtype = getDtypeSdk();
    const ids = getTableIds();
    const data = JSON.stringify<SetRouteRequest>(req)
    dtype.Insert(ids.registry, TableNameRegistry, data);
    httpsw.SetRouteHandler(new SetRouteHandlerRequest(req.route, req.contract_address))
    return new ArrayBuffer(0)
}

export function RemoveRoute(req: RemoveRouteRequest): ArrayBuffer {
    const dtype = getDtypeSdk();
    const ids = getTableIds();
    const cond = `{"route":"${req.route}"}`
    dtype.Delete(ids.registry, TableNameRegistry, cond);
    httpsw.RemoveRouteHandler(new RemoveRouteHandlerRequest(req.route))
    return new ArrayBuffer(0)
}

export function HttpRequestHandler(req: HttpRequestIncoming): ArrayBuffer {
    const url = req.url.split("?")[0];
    const routes = getCompatibleRoutes(url);
    let maxlen = 0;
    let contractAddr = "";
    for (let i = 0; i < routes.length; i++) {
        if (routes[i].route.length > maxlen) {
            maxlen = routes[i].route.length;
            contractAddr = routes[i].contract_address;
        }
    }
    if (contractAddr == "") return defaultResponse();
    const calld = `{"HttpRequestHandler":${JSON.stringify<HttpRequestIncoming>(req)}}`
    const resp = callContract(contractAddr, calld, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`call to ${contractAddr} failed: ${resp.data}`)
    }
    return String.UTF8.encode(resp.data)
}

export function getCompatibleRoutes(url: string): RouteToRead[] {
    const dtype = getDtypeSdk();
    const ids = getTableIds();
    const query = `SELECT * FROM ${TableNameRegistry} WHERE '${url}' LIKE route || '%';`;
    const result = dtype.ReadRaw(ids.registry, TableNameRegistry, query, []);
    const routes = JSON.parse<RouteToRead[]>(result)
    return routes;
}

export function defaultResponse(): ArrayBuffer {
    const headers = new Map<string,string[]>();
    headers.set("Content-Type", ["application/json"])
    const resp = new HttpResponseWrap("", new HttpResponse(
        "200 OK",
        200,
        headers,
        stringToBase64(`{"a":1}`),
    ))
    return String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
}

export function getRoutesInternal(): RouteToRead[] {
    const dtype = getDtypeSdk();
    const ids = getTableIds();
    const cond = `{}`;
    const resp = dtype.Read(ids.registry, TableNameRegistry, cond);
    return JSON.parse<RouteToRead[]>(resp)
}


function getDtypeSdk(): DTypeSdk {
    return new DTypeSdk(MODULE_NAME, revert, LoggerInfo, LoggerError, LoggerDebug, LoggerDebugExtended);
}
