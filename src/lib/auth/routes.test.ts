import { describe, expect, it } from "vitest";
import { isPrivateRoute } from "./routes";

describe("isPrivateRoute", () => {
  it("matches /history and its subpaths", () => {
    expect(isPrivateRoute("/history")).toBe(true);
    expect(isPrivateRoute("/history/123")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isPrivateRoute("/")).toBe(false);
    expect(isPrivateRoute("/about")).toBe(false);
    expect(isPrivateRoute("/sign-in")).toBe(false);
    expect(isPrivateRoute("/historyx")).toBe(false);
  });
});
