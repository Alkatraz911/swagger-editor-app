import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../messages/en.json";
import AboutPage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => {
    const messages = enMessages[namespace as keyof typeof enMessages] as Record<
      string,
      unknown
    >;

    const translate = (key: string, values?: Record<string, string>) => {
      const parts = key.split(".");
      let value: unknown = messages;

      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }

      if (typeof value !== "string") {
        throw new Error(`Missing translation: ${namespace}.${key}`);
      }

      if (!values) {
        return value;
      }

      return Object.entries(values).reduce(
        (result, [name, replacement]) =>
          result.replace(`{${name}}`, replacement),
        value,
      );
    };

    translate.raw = (key: string) => {
      const parts = key.split(".");
      let value: unknown = messages;

      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }

      return value;
    };

    return translate;
  },
}));

describe("AboutPage", () => {
  it("renders course information, team members, and GitHub links", async () => {
    render(await AboutPage());

    expect(
      screen.getByText(/Rolling Scopes School is a free, volunteer-run/i),
    ).toBeInTheDocument();

    for (const member of enMessages.about.team.members) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      expect(screen.getByText(member.role)).toBeInTheDocument();

      const githubLink = screen.getByRole("link", {
        name: `GitHub profile of ${member.name}`,
      });
      expect(githubLink).toHaveAttribute("href", member.github);
    }

    expect(
      screen.getByRole("link", { name: enMessages.about.project.repoLabel }),
    ).toHaveAttribute("href", enMessages.about.links.repository);

    expect(
      screen.getByRole("link", { name: enMessages.about.project.demoLabel }),
    ).toHaveAttribute("href", enMessages.about.links.demo);
  });
});
