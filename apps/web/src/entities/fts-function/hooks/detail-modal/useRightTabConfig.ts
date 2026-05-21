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
  renderLinker: () => ReactNode;
};

/**
 * Declarative tab configuration for the right-side panel.
 * The add-detail form is intentionally not part of this panel anymore:
 * it opens from the modal header.
 */
export function useRightTabConfig(args: UseRightTabConfigArgs): RightTabDef[] {
  const { hasSelectedRow, renderLinks, renderDetails, renderLinker } = args;

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
          id: RightTab.LINKER,
          i18nKey: I18N.modal.tabs.bind,
          testId: "tab-link-picker",
          disabled: !hasSelectedRow,
          render: renderLinker,
        },
      ],
      [hasSelectedRow, renderLinks, renderDetails, renderLinker],
  );
}