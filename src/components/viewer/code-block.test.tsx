import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeBlock, transformValue } from "./code-block";

const petstoreRoot = {
  components: {
    schemas: {
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Dogs" },
        },
      },
    },
  },
};

describe("transformValue", () => {
  it("passes plain objects through unchanged", () => {
    expect(transformValue({ a: 1 })).toEqual({ a: 1 });
  });

  it("extracts property examples and resolves nested $ref", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer", example: 10 },
        name: { type: "string", example: "doggie" },
        category: { $ref: "#/components/schemas/Category" },
      },
    };

    expect(transformValue(schema, petstoreRoot)).toEqual({
      id: 10,
      name: "doggie",
      category: { id: 1, name: "Dogs" },
    });
  });

  it("uses schema.example when set on the root node", () => {
    expect(transformValue({ type: "string", example: "hi" })).toBe("hi");
  });

  it("uses the first enum value when no example is set", () => {
    expect(
      transformValue({
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["available", "pending", "sold"],
          },
        },
      }),
    ).toEqual({ status: "available" });
  });

  it("prefers example over enum", () => {
    expect(
      transformValue({
        type: "string",
        example: "sold",
        enum: ["available", "pending", "sold"],
      }),
    ).toBe("sold");
  });

  it("builds array examples from item schemas", () => {
    const schema = {
      type: "array",
      items: { type: "string", example: "photo" },
    };
    expect(transformValue(schema)).toEqual(["photo"]);
  });

  it("uses items.type placeholder when array items have no example", () => {
    expect(
      transformValue({
        type: "array",
        items: { type: "string" },
      }),
    ).toEqual(["string"]);
  });

  it("resolves $ref items and builds object placeholders for array elements", () => {
    const root = {
      components: {
        schemas: {
          Tag: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
    };

    expect(
      transformValue(
        {
          type: "array",
          items: { $ref: "#/components/schemas/Tag" },
        },
        root,
      ),
    ).toEqual([{ id: 0, name: "string" }]);
  });
});

describe("CodeBlock", () => {
  it("pretty-prints objects as JSON", () => {
    render(<CodeBlock value={{ a: 1 }} />);
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
  });

  it("renders string values verbatim", () => {
    render(<CodeBlock value="plain text" />);
    expect(screen.getByText("plain text")).toBeInTheDocument();
  });

  it("falls back to String() for non-serializable values", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    render(<CodeBlock value={circular} />);
    expect(screen.getByText("[object Object]")).toBeInTheDocument();
  });

  it("renders an editable textarea when editable is true", () => {
    render(<CodeBlock value={{ a: 1 }} editable />);
    expect(screen.getByRole("textbox")).toHaveValue('{\n  "a": 1\n}');
  });

  it("renders read-only pre when editable is false", () => {
    render(<CodeBlock value={{ a: 1 }} editable={false} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
  });

  it("renders XML when mediaType is application/xml", () => {
    render(<CodeBlock value={{ name: "Ada" }} mediaType="application/xml" />);
    expect(screen.getByText(/<name>Ada<\/name>/)).toBeInTheDocument();
  });

  it("renders form-urlencoded when mediaType is application/x-www-form-urlencoded", () => {
    render(
      <CodeBlock
        value={{ name: "Ada", active: true }}
        mediaType="application/x-www-form-urlencoded"
      />,
    );
    expect(screen.getByText("name=Ada&active=true")).toBeInTheDocument();
  });
});
