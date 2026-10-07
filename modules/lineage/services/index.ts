import { IS_MOCK } from "../lib/config";
import { httpLineageApi } from "./httpLineageApi";
import type { LineageApi } from "./lineageClient";
import { mockLineageApi } from "./mock/lineageApi";

export const lineageApi: LineageApi = IS_MOCK ? mockLineageApi : httpLineageApi;

export { httpLineageApi, mockLineageApi };
export type { ExploreQuery, LineageApi } from "./lineageClient";