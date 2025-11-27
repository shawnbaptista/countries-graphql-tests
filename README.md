### 1. Clone repo
### 2. Install `bun` via curl, as instructed on their page
* https://bun.com/ 

### 3. Install dependencies
```commandLine
bun install
```

### 4. Start server
```
bun run dev
```

### Running tests
```commandLine
bun test
```

### Running GraphQL queries manually
1. `bun run dev`
* Console output should provide the following options:
* `[b] open a browser [d] open devtools [c] clear console [x] to exit`
2. Open a browser for navigating to the local server
3. Navigate to the GraphiQL explorer
* Append `/graphql` to the local server

### Dev install notes

* Declared bun as the project's package manager

Obtain bun's version
```commandLine
bun --version
```
Added bun to `package.json`
```json
"packageManager": "bun@1.3.3"
```

* Installed `node` on machine
```bash
brew install node 
```

* Installed `vitest` as dev dependency
```bash
bun add -D vitest @vitest/ui
```

TODO: Add schema-level and http smoke tests
* schema-level will be fastest as they do not interact with HTTP, workers, or network
  * Deterministic
  * Great for contract tests
  * Use `execute` and `parse` from `graphql`
* http smoke tests
  * Hit the real deploy handler
  * Verify routing, headers, and body behavior
  * Smoke / deployment verification 
```commandLine
└── tests
    └── graphql
        ├── schema-queries.test.ts      # schema-level tests (fast)
        ├── schema-filters.test.ts      # filter behavior
        └── http-smoke.todo.ts          # end-to-end HTTP smoke tests
```

### WebStorm Run/Debug Configuration

```commandLine
Node Interpreter: .../node/versions/22.21.0/bin/node {same path as found via executing `which node`} 
TypeScript Loader: None 
Node Parameters: None 
Working Directory: project root path 
File: node_modules/vitest/vitest.mjs 
Application Parameters: run --no-file-parallelism --config=vitest.config.ts
Environment Variables: None
```

### WebStorm Settings - Editor

* Editor -> Code Style -> TypeScript -> Tabs and Indents:
  * Indent: 2
  * Continuation indent: 2

_WHY: ESLint demands it. If these values are set to the default of 4, red squiggly lines appear and WebStorm will recommend via ESLint to run prettier/prettier._ 


## TypeScript Notes

* If interfaces are in a file and to be used elsewhere, declare them as `export interface <InterfaceName> {}`
  * Import them into a file via `import type {<InterfaceName>} from "<relativeFilePathWithoutExtension>"`
  * e.g., `import type { Continent, Country, Language } from "../types"` -- `types.ts`
* Asynchronous functions are declared as `async function <functionName>(<arguments>){<logic>}`
  * If called by another function, use `async()`
  * If storing the result of an asynchronous function, declaring a variable, use `await <asyncFunction>`
    * e.g., `const result = await runOperation("SingleEntity");` 
* Exceptions are raised as `throw new Error("<message>");`
  * e.g. `if (!result.data) { throw new Error("Expected data to be defined."); }`
* 

* Assertions:
  * `expect(<item>).toBe<Assertion>(<expectedCheck>)`
    * e.g., `expect(Array.isArray(continents)).toBe(true);`
    * e.g., `expect(continents.length).toBeGreaterThan(0);`
* 


---

# Original Source Repo by Trevor Blades: 
* https://github.com/trevorblades/countries
* https://countries.trevorblades.com/

---
<p align="center">
  <img src="./logo.png" alt="globe" width="150">
</p>

<h1 align="center">Countries GraphQL API</h1>

<div align="center">

[![Build Status](https://github.com/trevorblades/countries/workflows/Node%20CI/badge.svg)](https://github.com/trevorblades/countries/actions)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![Twitter Follow](https://img.shields.io/twitter/follow/trevorblades?style=social)](https://twitter.com/trevorblades)

</div>

A public GraphQL API for information about countries, continents, and languages. This project uses [Countries List](https://annexare.github.io/Countries/) and [`provinces`](https://www.npmjs.com/package/provinces) as data sources, so the schema follows the shape of that data, with a few exceptions:

1. The codes used to key the objects in the original data are available as a `code` property on each item returned from the API.
1. The `Country.continent` and `Country.languages` are now objects and arrays of objects, respectively.
1. The `Country.currency` and `Country.phone` fields _sometimes_ return a comma-separated list of values. For this reason, this API also exposes `currencies` and `phones` fields that are arrays of all currencies and phone codes for a country.
1. Each `Country` has an array of `states` populated by their states/provinces, if any.
1. Each `Country` also has an `awsRegion` field that shows its nearest AWS region, powered by [`country-to-aws-region`](https://github.com/Zeryther/country-to-aws-region).

## Writing queries

```graphql
query GetCountry {
  country(code: "BR") {
    name
    native
    capital
    emoji
    currency
    languages {
      code
      name
    }
  }
}
```

The above GraphQL query will produce the following JSON response:

```json
{
  "data": {
    "country": {
      "name": "Brazil",
      "native": "Brasil",
      "capital": "Brasília",
      "emoji": "🇧🇷",
      "currency": "BRL",
      "languages": [
        {
          "code": "pt",
          "name": "Portuguese"
        }
      ]
    }
  }
}
```

Check out [the playground](https://countries.trevorblades.com) to explore the schema and test out some queries.

## Filtering

The `countries`, `continents`, and `languages` top-level `Query` fields accept an optional `filter` argument that causes results to be filtered on one or more subfields. The `continents` and `languages` fields can be filtered by their `code`, while `countries` can be filtered by `code`, `currency`, or `continent`.

> Note: The `continent` filter on the `Query.countries` field must be the continent code, i.e. "SA" for South America.

The filtering logic is powered by [sift](https://github.com/crcn/sift.js) and this API supports the following operators: `eq`, `ne`, `in`, `nin`, and `regex`. To learn more about these operators and how they work, check out [the sift docs](https://github.com/crcn/sift.js#supported-operators).

Here are some examples of filtering that you can copy and paste into [the playground](https://countries.trevorblades.com) to try for yourself:

```graphql
query ListCountriesThatUseUSD {
  countries(filter: { currency: { eq: "USD" } }) {
    code
    name
  }
}

query ListCountriesInCUSMA {
  countries(filter: { code: { in: ["US", "CA", "MX"] } }) {
    code
    name
    languages {
      name
    }
  }
}

query ListCountriesThatBeginWithTheLetterA {
  countries(filter: { name: { regex: "^A" } }) {
    code
    name
    currency
  }
}
```

## Examples

- [React](./examples/react)
- [React Native](https://github.com/muhzi4u/country-directory-app)
- [ReasonML](https://medium.com/@idkjs/reasonml-and-graphql-without-graphql-part-1-192c2e9e349c)
- [Country quiz app](https://github.com/byrichardpowell/Country-Quiz) (React, TypeScript)
- [Python](./examples/python)
- [Seed](https://github.com/seed-rs/seed/tree/master/examples/graphql)
- [Country Searcher](https://github.com/FranP-code/country-searcher)

## License

[MIT](./LICENSE)

[![Powered by Stellate, the GraphQL API Management platform](https://stellate.co/badge.svg)](https://stellate.co/?ref=powered-by)
