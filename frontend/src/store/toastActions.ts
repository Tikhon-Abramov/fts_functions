type ToastActionHandler = () => void;

const toastActionHandlers = new Map<string, ToastActionHandler>();

export const registerToastAction = (actionId: string, handler: ToastActionHandler) => {
  toastActionHandlers.set(actionId, handler);
};

export const getToastActionHandler = (actionId: string): ToastActionHandler | undefined => {
  return toastActionHandlers.get(actionId);
};
