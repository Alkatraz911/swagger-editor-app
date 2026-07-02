import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { Endpoint } from "@/lib/openapi/endpoints";
import { EndpointList, endpointId } from "./endpoint-list";

function makeEndpoint(
  partial: Partial<Endpoint> & Pick<Endpoint, "method" | "path">,
): Endpoint {
  return {
    tags: [],
    deprecated: false,
    parameters: { path: [], query: [], header: [], cookie: [] },
    requestBody: null,
    responses: [],
    ...partial,
  };
}

const listProps = {
  serverName: [{ url: "https://api.example.com" }],
  title: "Sample API",
  description: "Sample description",
};

const endpoints: Endpoint[] = [
  makeEndpoint({ method: "get", path: "/users", summary: "List users" }),
  makeEndpoint({ method: "post", path: "/users", summary: "Create user" }),
  makeEndpoint({ method: "get", path: "/health", summary: "Health check" }),
];

describe("EndpointList", () => {
  it("shows endpoints with method badges and paths", () => {
    renderWithIntl(
      <EndpointList
        {...listProps}
        endpoints={endpoints}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /List users/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create user/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Health check/ }),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the endpoint id when clicked", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <EndpointList
        {...listProps}
        endpoints={endpoints}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Create user/ }));
    expect(onSelect).toHaveBeenCalledWith("post:/users");
  });

  it("marks the selected endpoint via aria-expanded and aria-current", () => {
    renderWithIntl(
      <EndpointList
        {...listProps}
        endpoints={endpoints}
        selectedId={endpointId(endpoints[0])}
        onSelect={vi.fn()}
      />,
    );

    const selected = screen.getByRole("button", { name: /List users/ });
    expect(selected).toHaveAttribute("aria-current", "true");
    expect(selected).toHaveAttribute("aria-expanded", "true");
  });

  it("expands details inline when selected", () => {
    renderWithIntl(
      <EndpointList
        {...listProps}
        endpoints={[
          makeEndpoint({
            method: "get",
            path: "/users",
            summary: "List users",
            responses: [{ statusCode: "200", description: "OK", content: [] }],
          }),
        ]}
        selectedId="get:/users"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Responses")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});
