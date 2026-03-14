/**
 * Option and result types for all core operations.
 * CLI layer builds options, core returns results, presentation formats them.
 */

// ─── Option Types (CLI → Core) ──────────────────────────────────────

export interface QueryDatabaseOptions {
	readonly database: string;
	readonly status?: string;
	readonly priority?: string;
	readonly limit?: number;
	readonly sort?: string;
}

export interface FetchPageOptions {
	readonly id: string;
	readonly includeContent?: boolean;
}

export interface CreatePageOptions {
	readonly database: string;
	readonly title: string;
	readonly properties?: Readonly<Record<string, unknown>>;
}

export interface UpdatePageOptions {
	readonly id: string;
	readonly database?: string;
	readonly properties?: Readonly<Record<string, unknown>>;
	readonly content?: string;
	readonly append?: boolean;
}

export interface DeletePageOptions {
	readonly id: string;
}

export interface CheckCalendarOptions {
	readonly days?: number;
}

export interface GmailTriageOptions {
	readonly limit?: number;
}

// ─── Result Types (Core → Presentation) ─────────────────────────────

export interface QueryRow {
	readonly [key: string]: string;
}

export interface QueryDatabaseResult {
	readonly databaseKey: string;
	readonly titleProp: string;
	readonly displayColumns: readonly string[];
	readonly rows: readonly QueryRow[];
}

export interface PageResult {
	readonly id: string;
	readonly url: string;
	readonly archived: boolean;
	readonly created: string;
	readonly lastEdited: string;
	readonly title: string;
	readonly titleProperty: string;
	readonly properties: Readonly<Record<string, string>>;
	readonly content: string | null;
}

export interface CreatePageResult {
	readonly id: string;
	readonly url: string;
	readonly title: string;
}

export interface UpdatePageResult {
	readonly id: string;
	readonly propertiesUpdated: boolean;
	readonly contentAction: "replaced" | "appended" | "none";
	readonly blockCount: number;
}

export interface DeletePageResult {
	readonly id: string;
	readonly url: string;
}

export interface CalendarEvent {
	readonly summary: string;
	readonly startTime: string | null;
	readonly startDate: string | null;
	readonly calendar: string;
}

export interface CalendarDayGroup {
	readonly dateKey: string;
	readonly label: string;
	readonly events: readonly CalendarEvent[];
}

export interface CheckCalendarResult {
	readonly days: readonly CalendarDayGroup[];
	readonly totalEvents: number;
}

export interface EmailMessage {
	readonly id: string;
	readonly from: string;
	readonly subject: string;
	readonly senderName: string;
}

export interface GmailTriageResult {
	readonly totalUnread: number;
	readonly actionable: readonly EmailMessage[];
}

// ─── Output Mode ─────────────────────────────────────────────────────

export type OutputMode = "human" | "json";
