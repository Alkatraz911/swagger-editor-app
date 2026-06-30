import { describe, expect, it } from "vitest";
import { credentialsSchema, passwordSchema } from "./schema";

function codes(input: string): string[] {
  const result = passwordSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Abcdef1!").success).toBe(true);
  });

  it("accepts a Unicode password", () => {
    expect(passwordSchema.safeParse("Пароль1!").success).toBe(true);
  });

  it("rejects passwords shorter than 8 chars", () => {
    expect(codes("Ab1!")).toContain("min8");
  });

  it("requires a letter", () => {
    expect(codes("1234567!")).toContain("letter");
  });

  it("requires a digit", () => {
    expect(codes("Abcdefg!")).toContain("digit");
  });

  it("requires a special character", () => {
    expect(codes("Abcdefg1")).toContain("special");
  });
});

describe("credentialsSchema", () => {
  it("accepts valid credentials", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "Abcdef1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "Abcdef1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain("email");
    }
  });
});
