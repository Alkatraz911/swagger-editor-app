import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { EndpointDetails } from "./endpoint-details";

const endpoint: Endpoint = {
  method: "post",
  path: "/users/{id}",
  summary: "Replace a user",
  description: "Replaces the user identified by id.",
  tags: ["users"],
  deprecated: true,
  parameters: {
    path: [
      {
        name: "id",
        location: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    query: [
      {
        name: "verbose",
        location: "query",
        required: false,
        schema: { type: "boolean" },
      },
    ],
    header: [
      {
        name: "X-Trace",
        location: "header",
        required: false,
        schema: { type: "string" },
      },
    ],
    cookie: [
      {
        name: "session",
        location: "cookie",
        required: false,
        schema: { type: "string" },
      },
    ],
  },
  requestBody: {
    required: true,
    content: [
      {
        mediaType: "application/json",
        schema: { type: "object", properties: { name: { type: "string" } } },
        example: { name: "Ada" },
      },
    ],
  },
  responses: [
    {
      statusCode: "200",
      description: "OK",
      content: [
        {
          mediaType: "application/json",
          schema: { type: "object" },
          example: { id: "1" },
        },
      ],
    },
    { statusCode: "404", description: "Not found", content: [] },
  ],
};

const SERVER_URL = "https://api.example.com";

function renderDetails(endpointOverride: Endpoint = endpoint) {
  return renderWithIntl(
    <EndpointDetails endpoint={endpointOverride} serverUrl={SERVER_URL} />,
  );
}

describe("EndpointDetails", () => {
  it("shows the method, path and deprecated flag", () => {
    renderDetails();
    expect(screen.getByText("post")).toBeInTheDocument();
    expect(screen.getByText("/users/{id}")).toBeInTheDocument();
    expect(screen.getByText("Deprecated")).toBeInTheDocument();
    expect(screen.getByText("Replace a user")).toBeInTheDocument();
  });

  it("lists parameters of every location", () => {
    renderDetails();
    expect(screen.getByText("Path parameters")).toBeInTheDocument();
    expect(screen.getByText("Query parameters")).toBeInTheDocument();
    expect(screen.getByText("Header parameters")).toBeInTheDocument();
    expect(screen.getByText("Cookie parameters")).toBeInTheDocument();
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("verbose")).toBeInTheDocument();
    expect(screen.getByText("X-Trace")).toBeInTheDocument();
    expect(screen.getByText("session")).toBeInTheDocument();
  });

  it("renders the request body schema and example", () => {
    renderDetails();
    expect(screen.getByText("Request body")).toBeInTheDocument();

    const requestBodySection = screen
      .getByText("Request body")
      .closest("section");
    expect(
      within(requestBodySection as HTMLElement).getByText("application/json"),
    ).toBeInTheDocument();
    expect(screen.getByText(/"name": "Ada"/)).toBeInTheDocument();
  });

  it("shows the media type from the spec", () => {
    renderDetails();
    expect(
      screen.getAllByText("application/json").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/"name": "Ada"/)).toBeInTheDocument();
  });

  it("lets the user switch media types when several are defined", () => {
    const multiMedia: Endpoint = {
      ...endpoint,
      requestBody: {
        required: true,
        content: [
          {
            mediaType: "application/json",
            schema: { type: "object" },
            example: { id: "1" },
          },
          {
            mediaType: "text/plain",
            schema: { type: "string" },
            example: "plain",
          },
        ],
      },
    };
    renderDetails(multiMedia);

    const requestBodySection = screen
      .getByText("Request body")
      .closest("section") as HTMLElement;
    const mediaTypeSelect =
      within(requestBodySection).getByLabelText("Media type");

    expect(
      within(requestBodySection).getByText(/"id": "1"/),
    ).toBeInTheDocument();
    fireEvent.change(mediaTypeSelect, {
      target: { value: "text/plain" },
    });
    expect(within(requestBodySection).getByText("plain")).toBeInTheDocument();
    expect(
      within(requestBodySection).queryByText(/"id": "1"/),
    ).not.toBeInTheDocument();
  });

  it("formats schema and example according to the selected media type", () => {
    const multiFormat: Endpoint = {
      ...endpoint,
      requestBody: {
        required: true,
        content: [
          {
            mediaType: "application/json",
            schema: {
              type: "object",
              properties: { name: { type: "string", example: "Ada" } },
            },
            example: { name: "Ada" },
          },
          {
            mediaType: "application/xml",
            schema: {
              type: "object",
              properties: { name: { type: "string", example: "Ada" } },
            },
            example: { name: "Ada" },
          },
          {
            mediaType: "application/x-www-form-urlencoded",
            schema: {
              type: "object",
              properties: { name: { type: "string", example: "Ada" } },
            },
            example: { name: "Ada" },
          },
        ],
      },
    };
    renderDetails(multiFormat);

    const requestBodySection = screen
      .getByText("Request body")
      .closest("section") as HTMLElement;
    const mediaTypeSelect =
      within(requestBodySection).getByLabelText("Media type");

    expect(
      within(requestBodySection).getAllByText(/"name": "Ada"/).length,
    ).toBeGreaterThanOrEqual(1);

    fireEvent.change(mediaTypeSelect, {
      target: { value: "application/xml" },
    });
    expect(
      within(requestBodySection).getAllByText(/<name>Ada<\/name>/).length,
    ).toBeGreaterThanOrEqual(1);

    fireEvent.change(mediaTypeSelect, {
      target: { value: "application/x-www-form-urlencoded" },
    });
    expect(
      within(requestBodySection).getAllByText("name=Ada").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders every response status code with its schema/example", () => {
    renderDetails();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByText(/"id": "1"/)).toBeInTheDocument();
  });

  it("shows an empty-parameters message when there are none", () => {
    const noParams: Endpoint = {
      ...endpoint,
      parameters: { path: [], query: [], header: [], cookie: [] },
    };
    renderDetails(noParams);
    expect(
      screen.getByText("This operation has no parameters."),
    ).toBeInTheDocument();
  });

  it("derives readable type labels from various schemas", () => {
    const variants: Endpoint = {
      method: "get",
      path: "/variants",
      tags: [],
      deprecated: false,
      parameters: {
        path: [
          {
            name: "list",
            location: "path",
            required: true,
            schema: { type: "array", items: { type: "string" } },
          },
        ],
        query: [
          {
            name: "bare",
            location: "query",
            required: false,
            schema: { type: "array" },
          },
          {
            name: "union",
            location: "query",
            required: false,
            schema: { type: ["string", "null"] },
          },
        ],
        header: [
          {
            name: "obj",
            location: "header",
            required: false,
            schema: { properties: { a: {} } },
          },
        ],
        cookie: [{ name: "unknown", location: "cookie", required: false }],
      },
      requestBody: null,
      responses: [],
    };
    renderDetails(variants);
    expect(screen.getByText("string[]")).toBeInTheDocument();
    expect(screen.getByText("array")).toBeInTheDocument();
    expect(screen.getByText("string | null")).toBeInTheDocument();
    expect(screen.getByText("object")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("toggles try it out mode with Execute and editable request body", () => {
    renderDetails();
    expect(
      screen.queryByRole("button", { name: "Execute" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try it out" }));
    expect(screen.getByRole("button", { name: "Execute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("button", { name: "Execute" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows parameter inputs in try it out mode and hides them on cancel", () => {
    renderDetails();
    expect(screen.queryByLabelText("id")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try it out" }));

    const idInput = screen.getByLabelText("id");
    const verboseInput = screen.getByLabelText("verbose");
    expect(idInput).toBeInTheDocument();
    expect(verboseInput).toBeInTheDocument();

    fireEvent.change(idInput, { target: { value: "42" } });
    expect(idInput).toHaveValue("42");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("id")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("verbose")).not.toBeInTheDocument();
  });

  it("colors 3xx/5xx/default responses and renders a request body without content", () => {
    const minimal: Endpoint = {
      method: "put",
      path: "/minimal",
      tags: [],
      deprecated: false,
      parameters: { path: [], query: [], header: [], cookie: [] },
      requestBody: { required: false, content: [] },
      responses: [
        { statusCode: "301", content: [] },
        { statusCode: "500", content: [] },
        { statusCode: "default", content: [{ mediaType: "text/plain" }] },
      ],
    };
    renderDetails(minimal);
    expect(screen.getByText("301")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("No example provided.")).toBeInTheDocument();
    expect(screen.getByText("text/plain")).toBeInTheDocument();
  });

  it("executes a request and renders a 404 response in the panel", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          body: '{"message":"missing"}',
          durationMs: 80,
          requestSize: 12,
          responseSize: 20,
        }),
        { status: 200 },
      ),
    );

    renderDetails();
    fireEvent.click(screen.getByRole("button", { name: "Try it out" }));
    fireEvent.change(screen.getByLabelText("id"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));

    await waitFor(() => {
      expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    });
    expect(screen.getByText(/"message": "missing"/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/proxy",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          '"url":"https://api.example.com/users/7"',
        ),
      }),
    );

    global.fetch = originalFetch;
  });

  it("generates a cURL command from the current try-it-out values", () => {
    renderDetails();
    fireEvent.click(screen.getByRole("button", { name: "Try it out" }));
    fireEvent.change(screen.getByLabelText("id"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate cURL" }));

    expect(screen.getByText("cURL command")).toBeInTheDocument();
    expect(
      screen.getByText(/curl -X POST 'https:\/\/api\.example\.com\/users\/7'/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/-H 'Content-Type: application\/json'/),
    ).toBeInTheDocument();
    expect(screen.getByText(/-d '\{/)).toBeInTheDocument();
  });

  it("copies the generated cURL command to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    renderDetails();
    fireEvent.click(screen.getByRole("button", { name: "Try it out" }));
    fireEvent.change(screen.getByLabelText("id"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate cURL" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce();
    });
    expect(writeText.mock.calls[0]?.[0]).toContain(
      "curl -X POST 'https://api.example.com/users/7'",
    );
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
