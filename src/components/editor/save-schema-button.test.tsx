import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useSpecStore } from "@/store/spec-store";
import { renderWithIntl } from "@/test/render-with-intl";

const { upsert, from, createClient, toastSuccess, toastError } = vi.hoisted(
  () => ({
    upsert: vi.fn(),
    from: vi.fn(),
    createClient: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/client", () => ({
  createClient,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

import { SaveSchemaButton } from "./save-schema-button";

beforeEach(() => {
  useSpecStore.getState().reset();
  upsert.mockReset();
  from.mockReset();
  createClient.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();

  upsert.mockResolvedValue({ error: null });
  from.mockReturnValue({ upsert });
  createClient.mockReturnValue({ from });
});

describe("SaveSchemaButton", () => {
  it("upserts the current spec for the signed-in user", async () => {
    useSpecStore.setState({
      rawText: "openapi: 3.0.3",
      format: "yaml",
    });

    renderWithIntl(<SaveSchemaButton userId="u1" />);

    fireEvent.click(screen.getByTestId("save-schema-button"));

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith(
        { user_id: "u1", content: "openapi: 3.0.3", format: "yaml" },
        { onConflict: "user_id" },
      );
    });
    expect(toastSuccess).toHaveBeenCalledWith("Schema saved.");
  });

  it("is disabled when the editor content is empty", () => {
    renderWithIntl(<SaveSchemaButton userId="u1" />);

    expect(screen.getByTestId("save-schema-button")).toBeDisabled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("shows an error toast when the upsert fails", async () => {
    useSpecStore.setState({
      rawText: '{"openapi":"3.0.3"}',
      format: "json",
    });
    upsert.mockResolvedValue({ error: { message: "save failed" } });

    renderWithIntl(<SaveSchemaButton userId="u1" />);

    fireEvent.click(screen.getByTestId("save-schema-button"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Could not save schema. Please try again.",
      );
    });
  });
});
