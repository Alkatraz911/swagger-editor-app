import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";

const { signIn, signUp, toastError } = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({ signIn, signUp }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

import { AuthForm } from "./auth-form";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthForm", () => {
  it("renders email, password and a submit button", () => {
    renderWithIntl(<AuthForm mode="sign-in" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and does not submit on invalid input", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "bad");
    await user.type(screen.getByLabelText(/password/i), "weak");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("calls signIn with the credentials on valid submit", async () => {
    signIn.mockResolvedValue(undefined); // success → server action redirects
    const user = userEvent.setup();
    renderWithIntl(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith("user@example.com", "Abcdef1!"),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows a toast when the server returns an error", async () => {
    signUp.mockResolvedValue({ error: "User already registered" });
    const user = userEvent.setup();
    renderWithIntl(<AuthForm mode="sign-up" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("User already registered"),
    );
  });

  it("shows a generic toast when the action throws", async () => {
    signIn.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderWithIntl(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Authentication failed. Please try again.",
      ),
    );
  });
});
