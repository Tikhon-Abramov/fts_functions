import { Inbox } from "@mui/icons-material";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_STATE_TEST_IDS, EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title and (optional) description", () => {
    renderWithProviders(
      <EmptyState title="Ничего нет" description="Создайте первую запись" />,
    );
    expect(screen.getByTestId(EMPTY_STATE_TEST_IDS.TITLE)).toHaveTextContent(
      "Ничего нет",
    );
    expect(
      screen.getByTestId(EMPTY_STATE_TEST_IDS.DESCRIPTION),
    ).toHaveTextContent("Создайте первую запись");
  });

  it("renders an icon when one is provided", () => {
    renderWithProviders(
      <EmptyState icon={<Inbox data-testid="custom-icon" />} title="X" />,
    );
    expect(screen.getByTestId(EMPTY_STATE_TEST_IDS.ICON)).toBeInTheDocument();
  });

  it("renders the primary action and fires the handler on click", async () => {
    const onPrimary = vi.fn();
    renderWithProviders(
      <EmptyState
        title="X"
        primaryActionLabel="Создать"
        onPrimaryAction={onPrimary}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId(EMPTY_STATE_TEST_IDS.PRIMARY_ACTION));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("renders the secondary action and fires the handler on click", async () => {
    const onSecondary = vi.fn();
    renderWithProviders(
      <EmptyState
        title="X"
        secondaryActionLabel="Сбросить"
        onSecondaryAction={onSecondary}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId(EMPTY_STATE_TEST_IDS.SECONDARY_ACTION));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("does NOT render an action button when only the label is provided", () => {
    renderWithProviders(<EmptyState title="X" primaryActionLabel="Создать" />);
    expect(
      screen.queryByTestId(EMPTY_STATE_TEST_IDS.PRIMARY_ACTION),
    ).not.toBeInTheDocument();
  });
});
