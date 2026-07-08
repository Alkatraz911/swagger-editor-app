import { describe, expect, it } from "vitest";
import { buildCurl } from "./curl";

describe("buildCurl", () => {
  it("builds a command with method, headers and body", () => {
    expect(
      buildCurl({
        method: "POST",
        url: "https://api.example.com/users",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: '{"name":"Ada"}',
      }),
    ).toBe(
      "curl -X POST 'https://api.example.com/users' \\\n  " +
        "-H 'Content-Type: application/json' \\\n  " +
        "-H 'Authorization: Bearer token' \\\n  " +
        `-d '{"name":"Ada"}'`,
    );
  });

  it("builds a minimal command without headers or body", () => {
    expect(
      buildCurl({
        method: "GET",
        url: "https://api.example.com/health",
      }),
    ).toBe("curl -X GET 'https://api.example.com/health'");
  });
});
