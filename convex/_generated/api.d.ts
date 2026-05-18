/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as clients from "../clients.js";
import type * as domain_constants from "../domain/constants.js";
import type * as financials from "../financials.js";
import type * as helpers from "../helpers.js";
import type * as notes from "../notes.js";
import type * as payments from "../payments.js";
import type * as projects from "../projects.js";
import type * as publishing from "../publishing.js";
import type * as services_events from "../services/events.js";
import type * as services_ledger from "../services/ledger.js";
import type * as settings from "../settings.js";
import type * as stages from "../stages.js";
import type * as task_stages from "../task_stages.js";
import type * as tasks from "../tasks.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  calendar: typeof calendar;
  clients: typeof clients;
  "domain/constants": typeof domain_constants;
  financials: typeof financials;
  helpers: typeof helpers;
  notes: typeof notes;
  payments: typeof payments;
  projects: typeof projects;
  publishing: typeof publishing;
  "services/events": typeof services_events;
  "services/ledger": typeof services_ledger;
  settings: typeof settings;
  stages: typeof stages;
  task_stages: typeof task_stages;
  tasks: typeof tasks;
  transactions: typeof transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
