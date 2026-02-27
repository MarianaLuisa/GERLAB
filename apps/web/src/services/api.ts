import type { ApiClient } from "./contracts";
import { httpApi } from "./httpApi";

export const api: ApiClient = httpApi;