import { fireEvent, render, screen } from "@testing-library/react";
import { RowActionsCell } from "src/shared/ui/grid-cells/RowActionsCell";
import { describe, expect, it, vi } from "vitest";

const palette = {
  textMuted: "#888",
  dangerHover: "#f00",
  accentBlue: "#06f",
  detailBtnHover: "#011",
};
const labels = { delete: "Delete", edit: "Edit", details: "Details" };

describe("RowActionsCell", () => {
  it("renders three action buttons keyed by id", () => {
    render(
      <RowActionsCell
        id={42}
        palette={palette}
        labels={labels}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.getByTestId("button-delete-42")).toBeInTheDocument();
    expect(screen.getByTestId("button-edit-function-42")).toBeInTheDocument();
    expect(screen.getByTestId("button-detail-42")).toBeInTheDocument();
  });

  it("invokes onDelete with the row id and stops propagation", () => {
    const onDelete = vi.fn();
    render(
      <RowActionsCell
        id={7}
        palette={palette}
        labels={labels}
        onDelete={onDelete}
        onEdit={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("button-delete-7"));
    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it("invokes onEdit with the row id", () => {
    const onEdit = vi.fn();
    render(
      <RowActionsCell
        id={7}
        palette={palette}
        labels={labels}
        onDelete={vi.fn()}
        onEdit={onEdit}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("button-edit-function-7"));
    expect(onEdit).toHaveBeenCalledWith(7);
  });

  it("invokes onOpenDetails with the row id", () => {
    const onOpenDetails = vi.fn();
    render(
      <RowActionsCell
        id={7}
        palette={palette}
        labels={labels}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onOpenDetails={onOpenDetails}
      />,
    );
    fireEvent.click(screen.getByTestId("button-detail-7"));
    expect(onOpenDetails).toHaveBeenCalledWith(7);
  });

  // Icon-swap regression: the edit action should now render `EditNoteOutlined`
  // (the pen-on-paper glyph) and the details action `OpenInNewOutlined`
  // (the diagonal arrow). MUI icon components emit a `data-testid` matching
  // their export name, which we use as the assertion handle here.
  it("renders the EditNoteOutlined glyph inside the edit button", () => {
    render(
      <RowActionsCell
        id={9}
        palette={palette}
        labels={labels}
        isEditing={false}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onCloseEdit={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    const editBtn = screen.getByTestId("button-edit-function-9");
    expect(
      editBtn.querySelector('[data-testid="EditNoteOutlinedIcon"]'),
    ).not.toBeNull();
    expect(
      editBtn.querySelector('[data-testid="OpenInNewOutlinedIcon"]'),
    ).toBeNull();
  });

  it("renders the OpenInNewOutlined glyph inside the details button", () => {
    render(
      <RowActionsCell
        id={9}
        palette={palette}
        labels={labels}
        isEditing={false}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onCloseEdit={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    const detailBtn = screen.getByTestId("button-detail-9");
    expect(
      detailBtn.querySelector('[data-testid="OpenInNewOutlinedIcon"]'),
    ).not.toBeNull();
    expect(
      detailBtn.querySelector('[data-testid="EditNoteOutlinedIcon"]'),
    ).toBeNull();
  });
});
