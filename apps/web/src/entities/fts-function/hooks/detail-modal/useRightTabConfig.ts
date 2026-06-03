import { type ReactNode, useMemo } from "react";
import { RightTab } from "src/entities/fts-function/model";
import { I18N, type I18nKey } from "src/shared/i18n";

export type RightTabDef = {
    id: RightTab;
    i18nKey?: I18nKey;
    label?: string;
    testId: string;
    disabled: boolean;
    render: () => ReactNode;
};

export type UseRightTabConfigArgs = {
    hasSelectedRow: boolean;
    hasFeedbackRow: boolean;
    renderLinks: () => ReactNode;
    renderDetails: () => ReactNode;
    renderFeedback: () => ReactNode;
    renderLinker: () => ReactNode;
    renderAction: () => ReactNode;
};

export function useRightTabConfig(args: UseRightTabConfigArgs): RightTabDef[] {
    const {
        hasSelectedRow,
        hasFeedbackRow,
        renderLinks,
        renderDetails,
        renderFeedback,
        renderLinker,
        renderAction,
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
                id: RightTab.FEEDBACK,
                label: "Обратная связь",
                testId: "tab-feedback",
                disabled: !hasFeedbackRow,
                render: renderFeedback,
            },
            {
                id: RightTab.LINKER,
                i18nKey: I18N.modal.tabs.bind,
                testId: "tab-link-picker",
                disabled: !hasSelectedRow,
                render: renderLinker,
            },
            {
                id: RightTab.ACTION,
                label: "Действие",
                testId: "tab-action",
                disabled: !hasSelectedRow,
                render: renderAction,
            },
        ],
        [
            hasSelectedRow,
            hasFeedbackRow,
            renderLinks,
            renderDetails,
            renderFeedback,
            renderLinker,
            renderAction,
        ],
    );
}