import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
	loadConfig,
	loadDatabases,
	loadEnv,
	loadSchemas,
} from "../src/config/loader.ts";

const fixturesDir = join(import.meta.dir, "fixtures");

describe("loadDatabases", () => {
	test("loads and parses valid databases.json", async () => {
		const dbs = await loadDatabases(join(fixturesDir, "databases.json"));
		expect(dbs).toHaveProperty("Test DB");
		expect(dbs["Test DB"]?.data_source_id).toBe(
			"a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d",
		);
		expect(dbs["Test DB"]?.title_property).toBe("Name");
	});

	test("throws on missing file", async () => {
		await expect(loadDatabases("/nonexistent/path.json")).rejects.toThrow(
			"databases.json not found",
		);
	});

	test("throws on invalid JSON structure", async () => {
		await expect(
			loadDatabases(join(fixturesDir, "invalid_databases.json")),
		).rejects.toThrow();
	});

	test("returns frozen object", async () => {
		const dbs = await loadDatabases(join(fixturesDir, "databases.json"));
		expect(Object.isFrozen(dbs)).toBe(true);
	});
});

describe("loadSchemas", () => {
	test("loads and parses valid schema_cache.json", async () => {
		const schemas = await loadSchemas(join(fixturesDir, "schema_cache.json"));
		expect(schemas).toHaveProperty("Test DB");
		expect(schemas["Test DB"]?.schema.Name).toEqual({ type: "title" });
	});

	test("throws on missing file", async () => {
		await expect(loadSchemas("/nonexistent/path.json")).rejects.toThrow(
			"schema_cache.json not found",
		);
	});
});

describe("loadEnv", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.NOTION_API_KEY = "ntn_test_key_12345";
		process.env.GITHUB_PAT = "ghp_test_pat_12345";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test("returns validated env values", () => {
		const env = loadEnv();
		expect(env.notionApiKey).toBe("ntn_test_key_12345");
		expect(env.githubPat).toBe("ghp_test_pat_12345");
	});

	test("throws when NOTION_API_KEY is missing", () => {
		delete process.env.NOTION_API_KEY;
		expect(() => loadEnv()).toThrow("NOTION_API_KEY");
	});

	test("GITHUB_PAT is optional", () => {
		delete process.env.GITHUB_PAT;
		const env = loadEnv();
		expect(env.notionApiKey).toBe("ntn_test_key_12345");
		expect(env.githubPat).toBeUndefined();
	});
});

describe("loadConfig", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.NOTION_API_KEY = "ntn_test_key_12345";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test("loads full config", async () => {
		const config = await loadConfig({
			databasesPath: join(fixturesDir, "databases.json"),
			schemasPath: join(fixturesDir, "schema_cache.json"),
		});
		expect(config.notionApiKey).toBe("ntn_test_key_12345");
		expect(config.databases).toHaveProperty("Test DB");
		expect(config.schemas).toHaveProperty("Test DB");
		expect(Object.isFrozen(config)).toBe(true);
	});
});
