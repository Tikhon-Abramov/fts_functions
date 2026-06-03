import type { TFunction } from "i18next";

import type {
    FtsFunctionActionType,
    FtsFunctionCategory,
} from "src/entities/fts-function/model";
import type {
    DetailAction,
    DetailActionFormInput,
    Feedback,
    FeedbackFormInput,
    Link,
    Row,
} from "src/entities/fts-function/types";
import type {
    AcceptFeedbackDto,
    CreateActionDto,
    CreateFeedbackDto,
    TypeResponseDto,
    UpdateFeedbackDto,
} from "src/shared/api/ftsFunctionsApi";

import { useCallback } from "react";
import {
    buildDetailInputFromRow,
    resolveDetailDto,
} from "src/entities/fts-function/api/detail-resolvers";
import {
    findTypeIdByCode,
    mapActionApiToDetailAction,
    mapFeedbackApiToFeedback,
} from "src/entities/fts-function/api/mappers";
import {
    FtsFunctionRelationType,
    FtsFunctionStep,
    RightTab,
} from "src/entities/fts-function/model";
import {
    useFtsFunctionControllerAcceptFeedbackV1Mutation,
    useFtsFunctionControllerCreatActionV1Mutation,
    useFtsFunctionControllerCreateDetailV1Mutation,
    useFtsFunctionControllerCreateFeedbackV1Mutation,
    useFtsFunctionControllerCreateTreeEdgeV1Mutation,
    useFtsFunctionControllerDeleteActionV1Mutation,
    useFtsFunctionControllerDeleteFeedbackV1Mutation,
    useFtsFunctionControllerDeleteTreeEdgeV1Mutation,
    useFtsFunctionControllerSoftDeleteDetailV1Mutation,
    useFtsFunctionControllerUpdateDetailV1Mutation,
    useFtsFunctionControllerUpdateFeedbackV1Mutation,
} from "src/shared/api/ftsFunctionsApi";
import { I18N } from "src/shared/i18n";
import { useAppDispatch } from "src/shared/store";
import {
    selectRowAndOpenLinkPicker,
    setRightTab as setRightTabAction,
    setSelectedRowId,
    showSnackbar,
} from "src/shared/store/uiSlice";

type RowFormInput = Partial<Row> & {
    category: FtsFunctionCategory;
    detailText: string;
    actionLabel: FtsFunctionActionType | "";
};

export type UseDetailActionsContext = {
    modalFunctionId: string | null;
    selectedId: string | null;
    rowMap: Map<string, Row>;
    links: Link[];
    typesAll: TypeResponseDto[] | undefined;
    t: TFunction;
};

export type DetailActions = {
    addRow: (item: RowFormInput & { step: FtsFunctionStep }) => string;
    updateRow: (id: string, updates: Partial<Row>) => void;
    removeRow: (rowId: string) => void;
    removeLink: (linkId: string) => void;
    createLinks: (targets: string[], kind: FtsFunctionRelationType) => void;
    quickLink: (id: string) => void;
    saveDual: (
        s1Data: Omit<RowFormInput, "step">,
        s2Data: Omit<RowFormInput, "step">,
    ) => void;
    createFeedback: (
        detailId: string,
        input: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    updateFeedback: (
        feedbackId: string,
        input: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    setFeedbackAcceptance: (
        feedbackId: string,
        isAccepted: boolean,
        rejectComment?: string,
    ) => Promise<Feedback | null>;
    deleteFeedback: (feedbackId: string) => Promise<boolean>;
    createAction: (
        detailId: string,
        input: DetailActionFormInput,
    ) => Promise<DetailAction | null>;
    deleteAction: (actionId: string) => Promise<boolean>;
    /**
     * Compatibility aliases for components that still use old names.
     */
    addFeedback: (
        detailId: string,
        input: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    editFeedback: (
        feedbackId: string,
        input: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    removeFeedback: (feedbackId: string) => Promise<boolean>;
};

function toNullableText(value: string): string | null {
    const trimmed = value.trim();

    return trimmed ? trimmed : null;
}

function toPositiveNumber(value: string): number | null {
    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toIsoDeadline(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) return null;

    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? `${trimmed}T00:00:00.000Z`
        : trimmed;
}

function buildFeedbackDto(
    input: FeedbackFormInput,
): CreateFeedbackDto & UpdateFeedbackDto {
    return {
        feedbackSourceIds: input.feedbackSourceIds
            .map(toPositiveNumber)
            .filter((id): id is number => id !== null),
        feedbackQualityMetricsId: toPositiveNumber(
            input.feedbackQualityMetricId,
        ),
        ftsMethodologyStatusId: toPositiveNumber(
            input.ftsMethodologyStatusId,
        ),
        problemDescription: toNullableText(input.problemDescription),
        initiatorRequisites: toNullableText(input.initiatorRequisites),
        initiatorAcceptance: toNullableText(input.initiatorAcceptance),
        deadline: toIsoDeadline(input.deadline),
    };
}

function buildActionDto(input: DetailActionFormInput): CreateActionDto | null {
    const statusId = toPositiveNumber(input.statusId);
    const description = input.description.trim();

    if (!statusId || !description) return null;

    return {
        statusId,
        description,
    };
}

export function useDetailActions(ctx: UseDetailActionsContext): DetailActions {
    const { modalFunctionId, selectedId, rowMap, links, typesAll, t } = ctx;

    const dispatch = useAppDispatch();

    const [createDetail] = useFtsFunctionControllerCreateDetailV1Mutation();
    const [updateDetail] = useFtsFunctionControllerUpdateDetailV1Mutation();
    const [deleteDetail] = useFtsFunctionControllerSoftDeleteDetailV1Mutation();
    const [createTreeEdge] = useFtsFunctionControllerCreateTreeEdgeV1Mutation();
    const [deleteTreeEdge] = useFtsFunctionControllerDeleteTreeEdgeV1Mutation();
    const [createFeedbackMutation] =
        useFtsFunctionControllerCreateFeedbackV1Mutation();
    const [updateFeedbackMutation] =
        useFtsFunctionControllerUpdateFeedbackV1Mutation();
    const [deleteFeedbackMutation] =
        useFtsFunctionControllerDeleteFeedbackV1Mutation();
    const [acceptFeedbackMutation] =
        useFtsFunctionControllerAcceptFeedbackV1Mutation();
    const [createActionMutation] =
        useFtsFunctionControllerCreatActionV1Mutation();
    const [deleteActionMutation] =
        useFtsFunctionControllerDeleteActionV1Mutation();

    const runMutation = useCallback((work: () => Promise<void>): void => {
        void (async () => {
            try {
                await work();
            } catch {
                /*
                 * RTK middleware reports failures globally.
                 */
            }
        })();
    }, []);

    const addRow = useCallback(
        (item: RowFormInput & { step: FtsFunctionStep }): string => {
            if (!modalFunctionId) return "";

            const dto = resolveDetailDto(item, typesAll);

            if (!dto) {
                dispatch(
                    showSnackbar({
                        message: "Справочники ещё загружаются, повторите позже",
                    }),
                );

                return "";
            }

            runMutation(async () => {
                const created = await createDetail({
                    id: modalFunctionId,
                    createFtsFunctionDetailDto: dto,
                }).unwrap();

                dispatch(
                    showSnackbar({
                        message: t(I18N.modal.snackbars.added, { id: created.id }),
                    }),
                );
            });

            return "";
        },
        [modalFunctionId, typesAll, createDetail, dispatch, t, runMutation],
    );

    const updateRow = useCallback(
        (id: string, updates: Partial<Row>) => {
            const existing = rowMap.get(id);

            if (!existing) return;

            const dto = resolveDetailDto(
                buildDetailInputFromRow(existing, updates),
                typesAll,
            );

            if (!dto) {
                dispatch(
                    showSnackbar({
                        message: "Справочники ещё загружаются, повторите позже",
                    }),
                );

                return;
            }

            runMutation(async () => {
                await updateDetail({
                    detailId: Number(id),
                    updateFtsFunctionDetailDto: dto,
                }).unwrap();

                dispatch(showSnackbar({ message: "Сведения обновлены" }));
            });
        },
        [rowMap, typesAll, updateDetail, dispatch, runMutation],
    );

    const removeRow = useCallback(
        (rowId: string) => {
            runMutation(async () => {
                await deleteDetail({ detailId: Number(rowId) }).unwrap();

                if (selectedId === rowId) dispatch(setSelectedRowId(null));

                dispatch(showSnackbar({ message: "Строка удалена" }));
            });
        },
        [deleteDetail, selectedId, dispatch, runMutation],
    );

    const removeLink = useCallback(
        (linkId: string) => {
            const target = links.find((link) => link.id === linkId);

            if (!target) return;

            runMutation(async () => {
                await deleteTreeEdge({
                    parentId: Number(target.fromId),
                    childId: Number(target.toId),
                }).unwrap();

                dispatch(showSnackbar({ message: "Связь удалена" }));
            });
        },
        [links, deleteTreeEdge, dispatch, runMutation],
    );

    const createLinks = useCallback(
        (targets: string[], kind: FtsFunctionRelationType) => {
            if (!selectedId) return;

            const relationTypeId = findTypeIdByCode(typesAll, kind);

            if (relationTypeId == null) {
                dispatch(showSnackbar({ message: "Тип связи ещё не загружен" }));

                return;
            }

            runMutation(async () => {
                for (const toId of targets) {
                    await createTreeEdge({
                        createFtsFunctionTreeDto: {
                            parentFtsFunctionId: Number(selectedId),
                            childFtsFunctionId: Number(toId),
                            relationTypeId,
                        },
                    }).unwrap();
                }

                dispatch(
                    showSnackbar({
                        message: t(I18N.modal.snackbars.linksAdded, {
                            count: targets.length,
                        }),
                    }),
                );
                dispatch(setRightTabAction(RightTab.LINKS));
            });
        },
        [
            selectedId,
            typesAll,
            createTreeEdge,
            dispatch,
            t,
            runMutation,
        ],
    );

    const quickLink = useCallback(
        (id: string) => {
            dispatch(selectRowAndOpenLinkPicker(id));
        },
        [dispatch],
    );

    const saveDual = useCallback(
        (
            s1Data: Omit<RowFormInput, "step">,
            s2Data: Omit<RowFormInput, "step">,
        ) => {
            if (!modalFunctionId) return;

            const dto1 = resolveDetailDto(
                { ...s1Data, step: FtsFunctionStep.OBJECT_SELECTION },
                typesAll,
            );
            const dto2 = resolveDetailDto(
                { ...s2Data, step: FtsFunctionStep.CLUSTERING_IMPACT },
                typesAll,
            );
            const relationTypeId = findTypeIdByCode(
                typesAll,
                FtsFunctionRelationType.CONNECTED,
            );

            if (!dto1 || !dto2 || relationTypeId == null) {
                dispatch(
                    showSnackbar({
                        message: "Справочники ещё загружаются, повторите позже",
                    }),
                );

                return;
            }

            runMutation(async () => {
                const s1 = await createDetail({
                    id: modalFunctionId,
                    createFtsFunctionDetailDto: dto1,
                }).unwrap();

                const s2 = await createDetail({
                    id: modalFunctionId,
                    createFtsFunctionDetailDto: dto2,
                }).unwrap();

                await createTreeEdge({
                    createFtsFunctionTreeDto: {
                        parentFtsFunctionId: s1.id,
                        childFtsFunctionId: s2.id,
                        relationTypeId,
                    },
                }).unwrap();

                dispatch(setSelectedRowId(String(s1.id)));
                dispatch(setRightTabAction(RightTab.LINKS));
                dispatch(
                    showSnackbar({
                        message: "Добавлены Шаг 1 + Шаг 2 со связью",
                    }),
                );
            });
        },
        [
            modalFunctionId,
            typesAll,
            createDetail,
            createTreeEdge,
            dispatch,
            runMutation,
        ],
    );

    const createFeedback = useCallback(
        async (
            detailId: string,
            input: FeedbackFormInput,
        ): Promise<Feedback | null> => {
            try {
                const created = await createFeedbackMutation({
                    detailId: Number(detailId),
                    createFeedbackDto: buildFeedbackDto(input),
                }).unwrap();

                dispatch(showSnackbar({ message: "Обратная связь добавлена" }));

                return mapFeedbackApiToFeedback(created);
            } catch {
                dispatch(
                    showSnackbar({
                        message: "Не удалось добавить обратную связь",
                    }),
                );

                return null;
            }
        },
        [createFeedbackMutation, dispatch],
    );

    const updateFeedback = useCallback(
        async (
            feedbackId: string,
            input: FeedbackFormInput,
        ): Promise<Feedback | null> => {
            try {
                const updated = await updateFeedbackMutation({
                    feedbackId: Number(feedbackId),
                    updateFeedbackDto: buildFeedbackDto(input),
                }).unwrap();

                dispatch(showSnackbar({ message: "Обратная связь обновлена" }));

                return mapFeedbackApiToFeedback(updated);
            } catch {
                dispatch(
                    showSnackbar({
                        message: "Не удалось обновить обратную связь",
                    }),
                );

                return null;
            }
        },
        [updateFeedbackMutation, dispatch],
    );

    const deleteFeedback = useCallback(
        async (feedbackId: string): Promise<boolean> => {
            try {
                await deleteFeedbackMutation({
                    feedbackId: Number(feedbackId),
                }).unwrap();

                dispatch(showSnackbar({ message: "Обратная связь удалена" }));

                return true;
            } catch {
                dispatch(
                    showSnackbar({
                        message: "Не удалось удалить обратную связь",
                    }),
                );

                return false;
            }
        },
        [deleteFeedbackMutation, dispatch],
    );

    const setFeedbackAcceptance = useCallback(
        async (
            feedbackId: string,
            isAccepted: boolean,
            rejectComment?: string,
        ): Promise<Feedback | null> => {
            const trimmedRejectComment = rejectComment?.trim() ?? "";

            if (!isAccepted && !trimmedRejectComment) {
                dispatch(
                    showSnackbar({
                        message: "Укажите причину отказа в согласовании",
                    }),
                );

                return null;
            }

            const acceptFeedbackDto: AcceptFeedbackDto = {
                isAccepted,
                ...(isAccepted ? {} : { rejectComment: trimmedRejectComment }),
            };

            try {
                const updated = await acceptFeedbackMutation({
                    feedbackId: Number(feedbackId),
                    acceptFeedbackDto,
                }).unwrap();

                dispatch(
                    showSnackbar({
                        message: isAccepted
                            ? "Обратная связь согласована"
                            : "Обратная связь не согласована",
                    }),
                );

                return mapFeedbackApiToFeedback(updated);
            } catch {
                dispatch(
                    showSnackbar({
                        message: isAccepted
                            ? "Не удалось согласовать обратную связь"
                            : "Не удалось отказать в согласовании",
                    }),
                );

                return null;
            }
        },
        [acceptFeedbackMutation, dispatch],
    );

    const createAction = useCallback(
        async (
            detailId: string,
            input: DetailActionFormInput,
        ): Promise<DetailAction | null> => {
            const createActionDto = buildActionDto(input);

            if (!createActionDto) {
                dispatch(
                    showSnackbar({
                        message: "Заполните описание и статус действия",
                    }),
                );

                return null;
            }

            try {
                const created = await createActionMutation({
                    detailId: Number(detailId),
                    createActionDto,
                }).unwrap();

                dispatch(showSnackbar({ message: "Операция добавлена" }));

                return mapActionApiToDetailAction(created, detailId);
            } catch {
                dispatch(
                    showSnackbar({
                        message: "Не удалось добавить операцию",
                    }),
                );

                return null;
            }
        },
        [createActionMutation, dispatch],
    );

    const deleteAction = useCallback(
        async (actionId: string): Promise<boolean> => {
            try {
                await deleteActionMutation({
                    actionId: Number(actionId),
                }).unwrap();

                dispatch(showSnackbar({ message: "Операция удалена" }));

                return true;
            } catch {
                dispatch(
                    showSnackbar({
                        message: "Не удалось удалить операцию",
                    }),
                );

                return false;
            }
        },
        [deleteActionMutation, dispatch],
    );

    return {
        addRow,
        updateRow,
        removeRow,
        removeLink,
        createLinks,
        quickLink,
        saveDual,
        createFeedback,
        updateFeedback,
        setFeedbackAcceptance,
        deleteFeedback,
        createAction,
        deleteAction,
        addFeedback: createFeedback,
        editFeedback: updateFeedback,
        removeFeedback: deleteFeedback,
    };
}