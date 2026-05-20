import type { ReactNode } from "react";
import type { FtsFunctionDetailedResponseDto } from "src/shared/api/ftsFunctionsApi";

import { act, renderHook, waitFor } from "@testing-library/react";
import { FunctionFormPanelMode } from "src/components/FunctionFormPanel/lib/types";
import { useFunctionForm } from "src/entities/fts-function/hooks/form/useFunctionForm";
import { SnackbarProvider } from "src/shared/ui/snackbar";
import { AllProviders } from "src/test-utils/render-with-providers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AllProviders>
      <SnackbarProvider>{children}</SnackbarProvider>
    </AllProviders>
  );
}

// ---------- mock RTK Query hooks at the module boundary ----------
const createMock = vi.fn();
const updateMock = vi.fn();
const batchAttachMock = vi.fn();
const detachMock = vi.fn();
const getByIdMock = vi.fn();

vi.mock("src/shared/api/ftsFunctionsApi", () => ({
  useFtsFunctionControllerCreateV1Mutation: () => [
    createMock,
    { isLoading: false },
  ],
  useFtsFunctionControllerUpdateV1Mutation: () => [
    updateMock,
    { isLoading: false },
  ],
  useFtsFunctionControllerBatchAttachDtisV1V1Mutation: () => [
    batchAttachMock,
    { isLoading: false },
  ],
  useFtsFunctionControllerDetachDtiV1Mutation: () => [
    detachMock,
    { isLoading: false },
  ],
  useFtsFunctionControllerGetByIdV1Query: (
    args: { id: number },
    opts: { skip: boolean },
  ) => getByIdMock(args, opts),
}));

// ---------- helpers ----------
const FN_ID = 42;

function detail(dtiIds: number[]): Pick<
  FtsFunctionDetailedResponseDto,
  "id" | "dtis"
> & {
  ftsFunctionNameId: number;
  ftsFunctionMarkerId: number;
  ftsCentralizationId: number;
  competencyCenterId: number;
  curatorCentralOfficeId: number;
  departmentHeadCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadInterregionalInspectionId: number;
} {
  return {
    id: FN_ID,
    ftsFunctionNameId: 1,
    ftsFunctionMarkerId: 2,
    ftsCentralizationId: 3,
    competencyCenterId: 4,
    curatorCentralOfficeId: 5,
    departmentHeadCentralOfficeId: 6,
    managerInterregionalInspectionId: 7,
    departmentHeadInterregionalInspectionId: 8,
    dtis: dtiIds.map((dtiId) => ({ dtiId })),
  };
}

function unwrappable<T>(value: T) {
  return { unwrap: () => Promise.resolve(value) };
}

beforeEach(() => {
  createMock.mockReset();
  updateMock.mockReset();
  batchAttachMock.mockReset();
  detachMock.mockReset();
  getByIdMock.mockReset();
  updateMock.mockReturnValue(unwrappable({ id: FN_ID }));
  batchAttachMock.mockReturnValue(unwrappable(undefined));
  detachMock.mockReturnValue(unwrappable(undefined));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useFunctionForm — DTI detach wiring", () => {
  it("fires detachDti for each baseline DTI removed in the form on update", async () => {
    getByIdMock.mockReturnValue({
      data: detail([10, 20, 30]),
      isLoading: false,
    });

    const { result } = renderHook(
      () =>
        useFunctionForm({
          mode: FunctionFormPanelMode.EDIT,
          editingFunctionId: FN_ID,
          expanded: true,
        }),
      { wrapper: Wrapper },
    );

    // Wait for the populate effect to seed defaultValues from detail.
    await waitFor(() => {
      expect(
        result.current.form.formState.defaultValues?.strategyProjectIds,
      ).toEqual(["10", "20", "30"]);
    });

    // User removes DTI 20.
    act(() => {
      result.current.form.setValue("strategyProjectIds", ["10", "30"], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(detachMock).toHaveBeenCalledTimes(1);
    expect(detachMock).toHaveBeenCalledWith({ id: FN_ID, dtiId: 20 });
    expect(batchAttachMock).not.toHaveBeenCalled();
  });

  it("fires both batchAttachDtis AND detachDti when DTIs are added and removed in one submit", async () => {
    getByIdMock.mockReturnValue({
      data: detail([10, 20]),
      isLoading: false,
    });

    const { result } = renderHook(
      () =>
        useFunctionForm({
          mode: FunctionFormPanelMode.EDIT,
          editingFunctionId: FN_ID,
          expanded: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(
        result.current.form.formState.defaultValues?.strategyProjectIds,
      ).toEqual(["10", "20"]);
    });

    // Drop 10, add 30.
    act(() => {
      result.current.form.setValue("strategyProjectIds", ["20", "30"], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(batchAttachMock).toHaveBeenCalledTimes(1);
    expect(batchAttachMock).toHaveBeenCalledWith({
      id: FN_ID,
      batchAttachDtisRequestDto: { dtiIds: [30] },
    });
    expect(detachMock).toHaveBeenCalledTimes(1);
    expect(detachMock).toHaveBeenCalledWith({ id: FN_ID, dtiId: 10 });
  });

  it("does not block sibling calls when one detach rejects (Promise.allSettled)", async () => {
    getByIdMock.mockReturnValue({
      data: detail([10, 20]),
      isLoading: false,
    });
    detachMock.mockImplementationOnce(() => ({
      unwrap: () => Promise.reject(new Error("boom")),
    }));
    detachMock.mockImplementationOnce(() => unwrappable(undefined));

    const onSaved = vi.fn();
    const { result } = renderHook(
      () =>
        useFunctionForm({
          mode: FunctionFormPanelMode.EDIT,
          editingFunctionId: FN_ID,
          expanded: true,
          onSaved,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(
        result.current.form.formState.defaultValues?.strategyProjectIds,
      ).toEqual(["10", "20"]);
    });

    act(() => {
      result.current.form.setValue("strategyProjectIds", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(detachMock).toHaveBeenCalledTimes(2);
    // Re-baseline + onSaved still fire even though one detach rejected.
    expect(onSaved).toHaveBeenCalledWith(FN_ID);
  });
});
