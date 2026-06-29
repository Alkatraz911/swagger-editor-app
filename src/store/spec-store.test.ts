import { beforeEach, describe, expect, it } from "vitest";
import { useSpecStore } from "./spec-store";

beforeEach(() => {
  useSpecStore.getState().reset();
});

describe("useSpecStore", () => {
  it("has sensible defaults", () => {
    const state = useSpecStore.getState();
    expect(state.rawText).toBe("");
    expect(state.format).toBe("yaml");
    expect(state.parsedSpec).toBeNull();
    expect(state.errors).toEqual([]);
  });

  it("updates raw text and format", () => {
    useSpecStore.getState().setRawText("openapi: 3.0.0");
    useSpecStore.getState().setFormat("json");

    expect(useSpecStore.getState().rawText).toBe("openapi: 3.0.0");
    expect(useSpecStore.getState().format).toBe("json");
  });

  it("stores a parsed result", () => {
    useSpecStore
      .getState()
      .setParsedResult({ parsedSpec: { openapi: "3.0.0" }, errors: ["oops"] });

    expect(useSpecStore.getState().parsedSpec).toEqual({ openapi: "3.0.0" });
    expect(useSpecStore.getState().errors).toEqual(["oops"]);
  });

  it("resets back to defaults", () => {
    useSpecStore.getState().setRawText("data");
    useSpecStore.getState().setParsedResult({ parsedSpec: {}, errors: ["e"] });

    useSpecStore.getState().reset();

    const state = useSpecStore.getState();
    expect(state.rawText).toBe("");
    expect(state.parsedSpec).toBeNull();
    expect(state.errors).toEqual([]);
  });
});
