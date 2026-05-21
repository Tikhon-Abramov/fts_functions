import type { TFunction } from "i18next";
import type {
  FtsFunctionActionType,
  FtsFunctionCategory,
} from "src/entities/fts-function/model";
import type { Link, Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback } from "react";

import {
  buildDetailInputFromRow,
  resolveDetailDto,
} from "src/entities/fts-function/api/detail-resolvers";
import { findTypeIdByCode } from "src/entities/fts-function/api/mappers";
import {
  FtsFunctionRelationType,
  FtsFunctionStep,
  RightTab,
} from "src/entities/fts-function/model";
import {
  useFtsFunctionControllerCreateDetailV1Mutation,
  useFtsFunctionControllerCreateTreeEdgeV1Mutation,
  useFtsFunctionControllerDeleteTreeEdgeV1Mutation,
  useFtsFunctionControllerSoftDeleteDetailV1Mutation,
  useFtsFunctionControllerUpdateDetailV1Mutation,
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
  addRow: (
      item: RowFormInput & {
        step: FtsFunctionStep;
      },
  ) => string;
  updateRow: (id: string, updates: Partial<Row>) => void;
  removeRow: (rowId: string) => void;
  removeLink: (linkId: string) => void;
  createLinks: (targets: string[], kind: FtsFunctionRelationType) => void;
  quickLink: (id: string) => void;
  saveDual: (
      s1Data: Omit<RowFormInput, "step">,
      s2Data: Omit<RowFormInput, "step">,
  ) => void;
  saveFeedback: (id: string, updates: Partial<Row>) => void;
  setFeedbackAcceptance: (
      id: string,
      isAccepted: boolean,
      rejectComment?: string,
  ) => void;
};

/**
 * Owns all detail-mutating callbacks the modal needs.
 */
export function useDetailActions(ctx: UseDetailActionsContext): DetailActions {
  const { modalFunctionId, selectedId, rowMap, links, typesAll, t } = ctx;
  const dispatch = useAppDispatch();

  const [createDetail] = useFtsFunctionControllerCreateDetailV1Mutation();
  const [updateDetail] = useFtsFunctionControllerUpdateDetailV1Mutation();
  const [deleteDetail] = useFtsFunctionControllerSoftDeleteDetailV1Mutation();
  const [createTreeEdge] = useFtsFunctionControllerCreateTreeEdgeV1Mutation();
  const [deleteTreeEdge] = useFtsFunctionControllerDeleteTreeEdgeV1Mutation();

  const runMutation = useCallback((work: () => Promise<void>): void => {
    void (async () => {
      try {
        await work();
      } catch {
        /* RTK middleware reports failures globally */
      }
    })();
  }, []);

  const addRow = useCallback(
      (
          item: RowFormInput & {
            step: FtsFunctionStep;
          },
      ): string => {
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
        const target = links.find((l) => l.id === linkId);
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
      [selectedId, typesAll, createTreeEdge, dispatch, t, runMutation],
  );

  const quickLink = useCallback(
      (id: string) => {
        dispatch(selectRowAndOpenLinkPicker(id));
      },
      [dispatch],
  );

  const saveDual = useCallback(
      (s1Data: Omit<RowFormInput, "step">, s2Data: Omit<RowFormInput, "step">) => {
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
              showSnackbar({ message: "Добавлены Шаг 1 + Шаг 2 со связью" }),
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

  const saveFeedback = useCallback(
      (id: string, updates: Partial<Row>) => {
        const existing = rowMap.get(id);
        if (!existing) return;

        const dto = resolveDetailDto(
            buildDetailInputFromRow(existing, {
              ...updates,
              isAccepted: null,
              rejectComment: "",
            }),
            typesAll,
        );

        if (!dto) {
          dispatch(
              showSnackbar({
                message: "Заполните все обязательные поля обратной связи",
              }),
          );
          return;
        }

        runMutation(async () => {
          await updateDetail({
            detailId: Number(id),
            updateFtsFunctionDetailDto: dto,
          }).unwrap();

          dispatch(showSnackbar({ message: "Обратная связь сохранена" }));
        });
      },
      [rowMap, typesAll, updateDetail, dispatch, runMutation],
  );

  const setFeedbackAcceptance = useCallback(
      (id: string, isAccepted: boolean, rejectComment?: string) => {
        const existing = rowMap.get(id);
        if (!existing) return;

        const dto = resolveDetailDto(
            buildDetailInputFromRow(existing, {
              isAccepted,
              rejectComment: isAccepted ? "" : rejectComment?.trim() || "",
            }),
            typesAll,
        );

        if (!dto) {
          dispatch(
              showSnackbar({
                message: "Не удалось подготовить данные обратной связи",
              }),
          );
          return;
        }

        runMutation(async () => {
          await updateDetail({
            detailId: Number(id),
            updateFtsFunctionDetailDto: dto,
          }).unwrap();

          dispatch(
              showSnackbar({
                message: isAccepted
                    ? "Обратная связь согласована"
                    : "Обратная связь не согласована",
              }),
          );
        });
      },
      [rowMap, typesAll, updateDetail, dispatch, runMutation],
  );

  return {
    addRow,
    updateRow,
    removeRow,
    removeLink,
    createLinks,
    quickLink,
    saveDual,
    saveFeedback,
    setFeedbackAcceptance,
  };
}