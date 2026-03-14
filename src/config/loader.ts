import { z } from "zod/v4";
import type {
	AppConfig,
	DatabaseRegistry,
	SchemaRegistry,
} from "../notion/types.ts";

const envSchema = z.object({
	NOTION_API_KEY: z.string().min(1, "NOTION_API_KEY is required"),
	GITHUB_PAT: z.string().optional(),
});

const databaseEntrySchema = z.object({
	data_source_id: z.string().uuid(),
	title_property: z.string().min(1),
});

const databasesSchema = z.record(z.string(), databaseEntrySchema);

function resolveProjectPath(relativePath: string): string {
	const projectRoot = import.meta.dir.replace(/\/src\/config$/, "");
	return `${projectRoot}/${relativePath}`;
}

export async function loadDatabases(path?: string): Promise<DatabaseRegistry> {
	const filePath = path ?? resolveProjectPath("context/databases.json");
	const file = Bun.file(filePath);
	const exists = await file.exists();
	if (!exists) {
		throw new Error(`databases.json not found at ${filePath}`);
	}
	const raw = await file.json();
	return Object.freeze(databasesSchema.parse(raw));
}

export async function loadSchemas(path?: string): Promise<SchemaRegistry> {
	const filePath = path ?? resolveProjectPath("context/schema_cache.json");
	const file = Bun.file(filePath);
	const exists = await file.exists();
	if (!exists) {
		throw new Error(`schema_cache.json not found at ${filePath}`);
	}
	const raw = await file.json();
	return Object.freeze(raw as SchemaRegistry);
}

export function loadEnv(): { notionApiKey: string; githubPat?: string } {
	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Environment validation failed:\n${issues}`);
	}
	return {
		notionApiKey: result.data.NOTION_API_KEY,
		githubPat: result.data.GITHUB_PAT,
	};
}

export async function loadConfig(options?: {
	databasesPath?: string;
	schemasPath?: string;
}): Promise<AppConfig> {
	const env = loadEnv();
	const [databases, schemas] = await Promise.all([
		loadDatabases(options?.databasesPath),
		loadSchemas(options?.schemasPath),
	]);

	return Object.freeze({
		databases,
		schemas,
		notionApiKey: env.notionApiKey,
		githubPat: env.githubPat,
	});
}
