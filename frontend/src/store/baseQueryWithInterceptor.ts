import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setUser } from './authSlice';
import { persistor, type AppDispatch, type RootState } from '.';
import type { ErrorResponseDto, RefreshResponseDto } from './ftsFunctionRegistry';
import { baseApi } from './baseApi';
import { Mutex } from 'async-mutex';
import qs from 'qs';
import { MESSAGES } from '../common/constants';
import { showError } from './errorSlice';
import { showErrorToast, showWarningToast } from './toastSlice';



const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  paramsSerializer: (params) => {
    return qs.stringify(params);
  },
  credentials: 'include',
});

export const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const dispatch = api.dispatch as AppDispatch;
  const state = api.getState() as RootState;

  await mutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const error = result.error;
    const status = error.status;
    const errData = error.data as ErrorResponseDto;

    const isRefreshRequest = typeof args !== 'string' && args.url === '/v1/token';

    if ([400, 409].includes(Number(status))) {
      showErrorSnackbar(errData, dispatch);
    }

    if (status === 401) {
      if (!isRefreshRequest && state.auth.user) {
        const refreshSuccess = await attemptTokenRefresh(api, extraOptions, dispatch);

        if (refreshSuccess) {
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          dispatch(showError(401));
          handleLogout(dispatch);
        }
      } else {
        // Тостим/показываем ошибку только если пользователь был залогинен.
        // Тихий бутстрап-рефреш без сессии не должен всплывать ошибкой.
        if (state.auth.user) {
          showErrorSnackbar(errData, dispatch);
          dispatch(showError(401));
        }

        handleLogout(dispatch);
      }
    } else {
      dispatch(showError(Number(status)));
    }
  }

  return result;
};


const attemptTokenRefresh = async (
  api: Parameters<typeof baseQueryWithInterceptor>[1],
  extraOptions: Parameters<typeof baseQueryWithInterceptor>[2],
  dispatch: AppDispatch
): Promise<boolean> => {
  if (mutex.isLocked()) {
    await mutex.waitForUnlock();
    return true;
  }

  const release = await mutex.acquire();

  try {
    const refreshResult = await rawBaseQuery(
      {
        url: '/v1/token',
        method: 'POST',
        credentials: 'include',
      } as FetchArgs,
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const refreshData = refreshResult.data as RefreshResponseDto;

      if (refreshData.user) {
        dispatch(setUser(refreshData.user));
      }
      return true;
    } else {
      const errorData = refreshResult.error?.data as ErrorResponseDto;
      if (errorData?.message) {
        showErrorSnackbar(errorData, dispatch);
      }
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    dispatch(
      showWarningToast(MESSAGES.AUTH_FAILED)
    );
    return false;
  } finally {
    release();
  }
};

const showErrorSnackbar = (errData: ErrorResponseDto | undefined, dispatch: AppDispatch): void => {
  if (!errData?.message) {
    dispatch(
      showErrorToast(MESSAGES.UNKNOWN_ERROR)
    );
    return;
  }

  let messageString = '';

  if (typeof errData.message === "string") {
    messageString = errData.message;
  } else if (Array.isArray(errData.message)) {
    const messages: string[] = [];
    errData.message.forEach((item: any) => {
      if (typeof item === "string") {
        messages.push(item);
      } else if (item?.message) {
        messages.push(item.message);
      }
    });
    messageString = messages.join(", ");
  }

  if (messageString) {
    dispatch(
      showErrorToast(messageString)
    );
  }
};

export const handleLogout = async (dispatch: AppDispatch): Promise<void> => {
  dispatch(logout());
  await persistor.purge();
  dispatch(baseApi.util.resetApiState());

  document.cookie = 'Authentication=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'Refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
