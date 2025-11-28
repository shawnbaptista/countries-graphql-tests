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

interface CountryCoreQuery {
  country: Country[];
}

interface NotFoundExampleQuery {
  continent: [];
  country: [];
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
    const { continents, countries, languages } =
      await runOperationExpectData<AllRootsQuery>("AllRoots");

    expect(Array.isArray(continents)).toBe(true);
    expect(Array.isArray(countries)).toBe(true);
    expect(Array.isArray(languages)).toBe(true);

    expect(continents.length).toBeGreaterThan(0);
    expect(countries.length).toBeGreaterThan(0);
    expect(languages.length).toBeGreaterThan(0);
  });

  it("SingleEntity returns a continent, country, and language by code", async () => {
    const { continent, country, language } =
      await runOperationExpectData<SingleEntityQuery>("SingleEntity");

    expect(continent.code).toBe("EU");
    expect(country.code).toBe("FR");
    expect(language.code).toBe("fr");
  });

  it("NotFoundExample", async () => {
    const data = await runOperationExpectData<NotFoundExampleQuery>("NotFoundExample");

    const { continent, country } = data as {
      continent: null;
      country: null;
    };

    expect(continent).toBeNull();
    expect(country).toBeNull();
  });

  it("ContinentShape", async () => {
    const { continents } = await runOperationExpectData("ContinentShape");

    expect(Array.isArray(continents)).toBe(true);
    expect(continents.length).toBeGreaterThan(0);

    for (const continent of continents) {
      // Check the basic shape
      expect(typeof continent.code).toBe("string");
      expect(typeof continent.name).toBe("string");

      // Check the `countries`
      expect(Array.isArray(continent.countries)).toBe(true);

      // Iterate through each country, verifying shape
      for (const country of continent.countries) {
        expect(typeof country.code).toBe("string");
        expect(typeof country.name).toBe("string");
      }
    }
  });

  it("CountryCore", async () => {
    const { countries } = await runOperationExpectData<CountryCoreQuery>("CountryCore");

    /**
     * countries
     */
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);

    let seenCountryWithLanguages = true;
    let seenUSWithStates = false;

    for (const country of countries) {
      expect(typeof country.code).toBe("string");
      expect(typeof country.name).toBe("string");

      /**
       * continents
       */
      if (country.continent) {
        expect(typeof country.continent.code).toBe("string");
      }

      /**
       * languages
       */
      // languages can be null for some territories-as-countries
      expect(Array.isArray(country.languages)).toBe(true);
      if (country.languages.length === 0) {
        // Allowed based on repo data -- see Antartica
      } else {
        seenCountryWithLanguages = true;
        for (const language of country.languages) {
          expect(typeof language.code).toBe("string");
          expect(typeof language.name).toBe("string");
        }
      }

      /**
       * states
       */
      expect(Array.isArray(country.states)).toBe(true);

      if (country.code === "US") {
        for (const state of country.states) {
          seenUSWithStates = true;
          expect(typeof state.code, `${country.name}`).toBe("string");
          expect(typeof state.name).toBe("string");
        }
      }
    }
    // Sanity check to make sure at least one country with a language has been checked
    expect(seenCountryWithLanguages).toBe(true);
    // Sanity check to make sure at least one state in the US has been checked
    expect(seenUSWithStates).toBe(true);
  });
});
