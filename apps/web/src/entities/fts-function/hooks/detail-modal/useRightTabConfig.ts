import { type ReactNode, useMemo } from "react";
import { RightTab } from "src/entities/fts-function/model";
import { I18N, type I18nKey } from "src/shared/i18n";

export type RightTabDef = {
  id: RightTab;
  i18nKey: I18nKey;
  testId: string;
  disabled: boolean;
  render: () => ReactNode;
};

export type UseRightTabConfigArgs = {
  hasSelectedRow: boolean;
  renderLinks: () => ReactNode;
  renderDetails: () => ReactNode;
  renderAdd: () => ReactNode;
  renderLinker: () => ReactNode;
};

/**
 * Declarative tab configuration for the right-side panel. Each entry pairs
 * a header (`i18nKey`, `disabled`) with the body renderer to call when the
 * tab is active. Replaces the four `rightTab === N && <…/>` blocks.
 */
export function useRightTabConfig(args: UseRightTabConfigArgs): RightTabDef[] {
  const {
    hasSelectedRow,
    renderLinks,
    renderDetails,
    renderAdd,
    renderLinker,
  } = args;

  return useMemo(
    () => [
      {
        id: RightTab.LINKS,
        i18nKey: I18N.modal.tabs.links,
        testId: "tab-links",
        disabled: false,
        render: renderLinks,
      },
      {
        id: RightTab.DETAILS,
        i18nKey: I18N.modal.tabs.details,
        testId: "tab-details",
        disabled: false,
        render: renderDetails,
      },
      {
        id: RightTab.ADD,
        i18nKey: I18N.modal.tabs.add,
        testId: "tab-add",
        disabled: false,
        render: renderAdd,
      },
      {
        id: RightTab.LINKER,
        i18nKey: I18N.modal.tabs.bind,
        testId: "tab-link-picker",
        disabled: !hasSelectedRow,
        render: renderLinker,
      },
    ],
    [hasSelectedRow, renderLinks, renderDetails, renderAdd, renderLinker],
  );
}
