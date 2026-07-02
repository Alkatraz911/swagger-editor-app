import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
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

describe("EndpointDetails", () => {
  it("shows the method, path and deprecated flag", () => {
    renderWithIntl(<EndpointDetails endpoint={endpoint} />);
    expect(screen.getByText("post")).toBeInTheDocument();
    expect(screen.getByText("/users/{id}")).toBeInTheDocument();
    expect(screen.getByText("Deprecated")).toBeInTheDocument();
    expect(screen.getByText("Replace a user")).toBeInTheDocument();
  });

  it("lists parameters of every location", () => {
    renderWithIntl(<EndpointDetails endpoint={endpoint} />);
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
    renderWithIntl(<EndpointDetails endpoint={endpoint} />);
    expect(screen.getByText("Request body")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Media type")[0]).toHaveValue(
      "application/json",
    );
    expect(screen.getByText(/"name": "Ada"/)).toBeInTheDocument();
  });

  it("switches schema and example when another media type is selected", () => {
    const multiMedia: Endpoint = {
      ...endpoint,
      requestBody: {
        required: true,
        content: [
          {
            mediaType: "application/json",
            schema: { type: "object" },
            example: { name: "Ada" },
          },
          {
            mediaType: "application/xml",
            schema: { type: "string" },
            example: "<user>Grace</user>",
          },
        ],
      },
    };
    renderWithIntl(<EndpointDetails endpoint={multiMedia} />);

    const select = screen.getAllByLabelText("Media type")[0];
    expect(screen.getByText(/"name": "Ada"/)).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "application/xml" } });
    expect(screen.getByText("<user>Grace</user>")).toBeInTheDocument();
    expect(screen.queryByText(/"name": "Ada"/)).not.toBeInTheDocument();
  });

  it("renders every response status code with its schema/example", () => {
    renderWithIntl(<EndpointDetails endpoint={endpoint} />);
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
    renderWithIntl(<EndpointDetails endpoint={noParams} />);
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
    renderWithIntl(<EndpointDetails endpoint={variants} />);
    expect(screen.getByText("string[]")).toBeInTheDocument();
    expect(screen.getByText("array")).toBeInTheDocument();
    expect(screen.getByText("string | null")).toBeInTheDocument();
    expect(screen.getByText("object")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
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
    renderWithIntl(<EndpointDetails endpoint={minimal} />);
    expect(screen.getByText("301")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("No example provided.")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "text/plain" }),
    ).toBeInTheDocument();
  });
});
