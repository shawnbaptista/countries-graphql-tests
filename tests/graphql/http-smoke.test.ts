import { describe, expect, it } from "vitest";

import { yoga } from "../../src/graphql";

// Allow the variable to be set via environment variables -- helpful for environment tests (AWS vs. Docker vs. local)
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:8787/graphql";

async function httpRequest(init: RequestInit & { url?: string } = {}) {
  const url = init.url ?? GRAPHQL_URL;

  const req = new Request(url, {
    method: init.method ?? "POST",
    headers: init.headers,
    body: init.body as BodyInit | null | undefined,
  });

  return yoga.fetch(req);
}

describe("HTTP smoke tests for GraphQL endpoint", () => {
  it("responds to a basic POST /graphql with 200 and data", async () => {
    const query = /* GraphQL */ `
      query Ping {
        __typename
      }
    `;
    const res = await httpRequest({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const json = (await res.json()) as {
      data?: { __typename: string };
      errors?: unknown;
    };

    expect(json.errors).toBeUndefined();
    expect(json.data).toBeDefined();
    expect(json.data?.__typename).toBe("Query");
  });
});
it("supports GET /graphql with query in the URL", async () => {
  const query = /* GraphQL */ `
    query Introspection {
      __schema {
        queryType {
          name
        }
      }
    }
  `;
  const url = `${GRAPHQL_URL}?query=${encodeURIComponent(query)}`;

  const res = await httpRequest({
    method: "GET",
    url,
  });

  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("application/json");

  const json = (await res.json()) as {
    data?: { __schema?: { queryType: { name: string } } };
    errors?: unknown;
  };

  expect(json.errors).toBeUndefined();
  expect(json.data?.__schema?.queryType.name).toBe("Query");
});
it("returns GraphQL errors for an invalid field, but still with 200 status code", async () => {
  const query = /* GraphQL */ `
    query InvalidField {
      totallyNotAField
    }
  `;

  const res = await httpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  expect(res.status).toBe(200);

  // Expecting an array of errors
  const json = (await res.json()) as {
    data?: unknown;
    errors?: unknown[];
  };

  expect(json.errors).toBeDefined();
  expect(json.data).toBeUndefined();
});
it("returns a 400-style error on invalid JSON in the request body", async () => {
  const res = await httpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Invalid JSON
    body: "{ not valid json ",
  });

  expect(res.status).toBeGreaterThanOrEqual(400);

  const text = await res.text();
  expect(text.length).toBeGreaterThan(0);
});
it("handles unsupported HTTP methods reasonably", async () => {
  const res = await httpRequest({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "query { __typename }" }),
  });

  expect(res.status).toBeGreaterThanOrEqual(400);
});
