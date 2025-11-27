import fs from "node:fs";
import path from "node:path";

import { type DocumentNode, Kind, parse } from "graphql";
import { describe, expect, it } from "vitest";

import { yoga } from "../../src/graphql";
import type { Continent, Country, Language } from "../types";

const getEnveloped = yoga.getEnveloped;

interface AllRootsQuery {
  continents: Continent[];
  countries: Country[];
  languages: Language[];
}

interface SingleEntityQuery {
  continent: Continent;
  country: Country;
  language: Language;
}

async function runOperation(operationName: string) {
  if (!OPERATION_NAMES.has(operationName)) {
    const available = Array.from(OPERATION_NAMES).join(", ");
    throw new Error(
      `Unknown operation: "${operationName}". Available operations [${available}]`,
    );
  }
  const { schema, execute } = getEnveloped({});
  return execute({ schema, document, operationName });
}

async function runOperationExpectData<TData>(
  operationName: string,
): Promise<TData> {
  const result = await runOperation(operationName);

  expect(result.errors).toBeUndefined();
  if (!result.data) {
    throw new Error("Expected data to be defined");
  }

  return result.data as TData;
}

// Load and parse once
const queriesSource = fs.readFileSync(
  path.join(__dirname, "../graphql/queries.graphql"),
  "utf8",
);
const document = parse(queriesSource);

function getOperationNames(doc: DocumentNode): string[] {
  return doc.definitions
    .filter((d) => d.kind === Kind.OPERATION_DEFINITION)
    .map((d: any) => d.name?.value)
    .filter(Boolean);
}

const OPERATION_NAMES = new Set(getOperationNames(document));

describe("Query root -- schema level", () => {
  it("AllRoots returns continents, countries, and languages", async () => {
    const data = await runOperationExpectData("AllRoots");

    const { continents, countries, languages } = data as AllRoots;
    expect(Array.isArray(continents)).toBe(true);
    expect(Array.isArray(countries)).toBe(true);
    expect(Array.isArray(languages)).toBe(true);

    expect(continents.length).toBeGreaterThan(0);
    expect(countries.length).toBeGreaterThan(0);
    expect(languages.length).toBeGreaterThan(0);
  });

  it("SingleEntity returns a continent, country, and language by code", async () => {
    const result = await runOperation("SingleEntity");
    expect(result.errors).toBeUndefined();
    if (!result.data) {
      throw new Error("Expected data to be defined");
    }

    const { continent, country, language } = result.data as SingleEntityQuery;
    expect(continent.code).toBe("EU");
    expect(country.code).toBe("FR");
    expect(language.code).toBe("fr");
  });

  it("NotFoundExample", async () => {
    const result = await runOperation("NotFoundExample");
    expect(result.errors).toBeUndefined();
    if (!result.data) {
      throw new Error("Expected data to be defined");
    }

    const { continent, country } = result.data as {
      continent: null;
      country: null;
    };

    expect(continent).toBeNull();
    expect(country).toBeNull();
  });
});
