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

const endpoints: Endpoint[] = [
  makeEndpoint({ method: "get", path: "/users", summary: "List users" }),
  makeEndpoint({ method: "post", path: "/users", summary: "Create user" }),
  makeEndpoint({ method: "get", path: "/health", summary: "Health check" }),
];

describe("EndpointList", () => {
  it("groups operations by path and shows the method badges", () => {
    renderWithIntl(
      <EndpointList
        endpoints={endpoints}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "/users" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "/health" }),
    ).toBeInTheDocument();
    expect(screen.getByText("List users")).toBeInTheDocument();
    expect(screen.getByText("Create user")).toBeInTheDocument();
    expect(screen.getAllByText("get")).toHaveLength(2);
    expect(screen.getByText("post")).toBeInTheDocument();
  });

  it("calls onSelect with the endpoint id when clicked", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <EndpointList
        endpoints={endpoints}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Create user/ }));
    expect(onSelect).toHaveBeenCalledWith("post:/users");
  });

  it("marks the selected endpoint via aria-current", () => {
    renderWithIntl(
      <EndpointList
        endpoints={endpoints}
        selectedId={endpointId(endpoints[0])}
        onSelect={vi.fn()}
      />,
    );

    const selected = screen.getByRole("button", { name: /List users/ });
    expect(selected).toHaveAttribute("aria-current", "true");
  });
});
