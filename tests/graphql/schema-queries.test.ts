import fs from "node:fs";
import path from "node:path";

import { parse } from "graphql";
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
  const { schema, execute } = getEnveloped({});
  return execute({ schema, document, operationName });
}

// Load and parse once
const queriesSource = fs.readFileSync(
  path.join(__dirname, "../graphql/queries.graphql"),
  "utf8",
);
const document = parse(queriesSource);

describe("Query root -- schema level", () => {
  it("AllRoots returns continents, countries, and languages", async () => {
    const result = await runOperation("AllRoots");
    expect(result.errors).toBeUndefined();
    if (!result.data) {
      throw new Error("Expected data to be defined");
    }

    const { continents, countries, languages } = result.data as AllRootsQuery;
    expect(Array.isArray(continents)).toBe(true);
    expect(Array.isArray(countries)).toBe(true);
    expect(Array.isArray(languages)).toBe(true);

    expect(continents.length).toBeGreaterThan(0);
    expect(continents.length).
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


});
