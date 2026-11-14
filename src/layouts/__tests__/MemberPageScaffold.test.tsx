import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemberPageScaffold } from "../MemberPageScaffold";

describe("MemberPageScaffold", () => {
  it("renders children inside a centered, padded page container", () => {
    const { container, getByText } = render(
      <MemberPageScaffold>
        <span>hello</span>
      </MemberPageScaffold>,
    );
    getByText("hello");
    const el = container.querySelector("[data-member-page]") as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.className).toContain("mx-auto");
    expect(el.className).toContain("max-w-5xl");
  });

  it.each([
    ["narrow", "max-w-3xl"],
    ["default", "max-w-5xl"],
    ["wide", "max-w-7xl"],
    ["full", "max-w-none"],
  ] as const)("maps width=%s to %s", (width, cls) => {
    const { container } = render(<MemberPageScaffold width={width}>x</MemberPageScaffold>);
    expect((container.querySelector("[data-member-page]") as HTMLElement).className).toContain(cls);
  });

  it("drops the inset with bleed and merges className", () => {
    const { container } = render(
      <MemberPageScaffold bleed className="custom-x">
        x
      </MemberPageScaffold>,
    );
    const el = container.querySelector("[data-member-page]") as HTMLElement;
    expect(el.className).not.toContain("px-3");
    expect(el.className).toContain("custom-x");
  });
});
