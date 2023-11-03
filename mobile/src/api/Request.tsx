import { useState, useCallback, ReactNode, useMemo } from 'react';
import { Portal, Snackbar } from 'react-native-paper';

/**
 * RequestStatus defines the different status types that an API request can have.
 */
export enum RequestStatus {
    NotSent = 'NOT_SENT',
    Loading = 'LOADING',
    Success = 'SUCCESS',
    Failure = 'FAILURE',
}

/**
 * Request defines the overall state of an API request, as well as functions to update that state.
 */
export interface Request<T = any> {
    status: RequestStatus;
    data?: T;
    error?: any;
    onStart: () => void;
    onSuccess: (data?: T) => void;
    onFailure: (error?: any) => void;
    reset: () => void;
    isLoading: () => boolean;
    isSent: () => boolean;
}

/**
 * useRequest returns a Request object that can be used to track the lifecycle of an API request.
 */
export function useRequest<T = any>(): Request<T> {
    const [status, setStatus] = useState<RequestStatus>(RequestStatus.NotSent);
    const [data, setData] = useState<T>();
    const [error, setError] = useState<any>();

    const onStart = useCallback(() => {
        setStatus(RequestStatus.Loading);
        setData(undefined);
        setError(undefined);
    }, [setStatus, setData, setError]);

    const onSuccess = useCallback(
        (data?: T) => {
            setData(data);
            setStatus(RequestStatus.Success);
        },
        [setData, setStatus]
    );

    const onFailure = useCallback(
        (error?: any) => {
            setError(error);
            setStatus(RequestStatus.Failure);
        },
        [setError, setStatus]
    );

    const reset = useCallback(() => {
        setStatus(RequestStatus.NotSent);
        setData(undefined);
        setError(undefined);
    }, [setStatus, setData, setError]);

    const isLoading = useCallback(() => {
        return status === RequestStatus.Loading;
    }, [status]);

    const isSent = useCallback(() => {
        return status !== RequestStatus.NotSent;
    }, [status]);

    return useMemo(
        () => ({
            status,
            data,
            error,
            onStart,
            onSuccess,
            onFailure,
            reset,
            isLoading,
            isSent,
        }),
        [status, data, error, onStart, onSuccess, onFailure, reset, isLoading, isSent]
    );
}

function isReactNode(node: any | ReactNode): node is ReactNode {
    if (node === null || node === undefined) {
        return true;
    }
    if (
        typeof node === 'string' ||
        typeof node === 'number' ||
        typeof node === 'boolean'
    ) {
        return true;
    }
    return false;
}

interface RequestSnackbarProps<T = any> {
    request: Request<T>;
    showError?: boolean;
    showSuccess?: boolean;
    defaultErrorMessage?: string;
    defaultSuccessMessage?: string;
}

export function RequestSnackbar<T = any>({
    request,
    showError,
    showSuccess,
    defaultErrorMessage,
    defaultSuccessMessage,
}: RequestSnackbarProps<T>) {
    let displayError =
        (showError === undefined || showError) &&
        request.status === RequestStatus.Failure &&
        request.error !== undefined;

    let displaySuccess = showSuccess && request.data !== undefined;

    let errorMessage =
        request.error?.response?.data?.message ||
        request.error?.message ||
        defaultErrorMessage ||
        'Something went wrong. Please try again later or contact support if the problem persists';

    if (errorMessage === 'Unauthorized') {
        errorMessage = 'Login expired. Please refresh and try again.';
    }

    const successMessage = isReactNode(request.data)
        ? request.data
        : defaultSuccessMessage || 'Request succeeded';

    return (
        <>
            {displayError && (
                <Portal>
                    <Snackbar visible={displayError} onDismiss={() => null}>
                        {errorMessage}
                    </Snackbar>
                </Portal>
            )}

            <Portal>
                <Snackbar visible={Boolean(displaySuccess)} onDismiss={request.reset}>
                    {successMessage}
                </Snackbar>
            </Portal>
        </>
    );
}
