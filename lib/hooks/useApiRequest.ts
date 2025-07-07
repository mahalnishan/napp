import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'

interface ApiRequestOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
  retryCount?: number
  retryDelay?: number
  optimisticUpdate?: () => void
  revertOptimisticUpdate?: () => void
}

interface ApiRequestState<T = any> {
  data: T | null
  loading: boolean
  error: Error | null
}

export const useApiRequest = <T = any>(
  initialData: T | null = null
) => {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: initialData,
    loading: false,
    error: null
  })
  
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const execute = useCallback(async (
    requestFn: (signal?: AbortSignal) => Promise<T>,
    options: ApiRequestOptions = {}
  ) => {
    const {
      onSuccess,
      onError,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage = 'Operation completed successfully',
      errorMessage = 'An error occurred',
      retryCount = 0,
      retryDelay = 1000,
      optimisticUpdate,
      revertOptimisticUpdate
    } = options

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Apply optimistic update if provided
    if (optimisticUpdate) {
      optimisticUpdate()
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    const attemptRequest = async (attempt: number): Promise<void> => {
      try {
        const result = await requestFn(signal)
        
        // Only update if not aborted
        if (!signal.aborted) {
          setState(prev => ({
            ...prev,
            data: result,
            loading: false,
            error: null
          }))

          if (showSuccessToast) {
            toast.success({
              title: 'Success',
              description: successMessage
            })
          }

          onSuccess?.(result)
        }
      } catch (error) {
        // Don't handle aborted requests
        if (signal.aborted) {
          return
        }

        const errorObj = error instanceof Error ? error : new Error(String(error))

        // Retry logic
        if (attempt < retryCount && !signal.aborted) {
          retryTimeoutRef.current = setTimeout(() => {
            attemptRequest(attempt + 1)
          }, retryDelay * Math.pow(2, attempt)) // Exponential backoff
          return
        }

        // Revert optimistic update if provided
        if (revertOptimisticUpdate) {
          revertOptimisticUpdate()
        }

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorObj
        }))

        if (showErrorToast) {
          toast.error({
            title: 'Error',
            description: errorMessage
          })
        }

        onError?.(errorObj)
      }
    }

    await attemptRequest(0)
  }, [toast])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null
    })
  }, [initialData])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    setState(prev => ({
      ...prev,
      loading: false
    }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    cancel
  }
}

// Specialized hooks for common operations

export const useApiMutation = <T = any, P = any>(
  mutationFn: (params: P, signal?: AbortSignal) => Promise<T>,
  options?: ApiRequestOptions
) => {
  const { execute, ...rest } = useApiRequest<T>()

  const mutate = useCallback((params: P, overrideOptions?: ApiRequestOptions) => {
    return execute(
      (signal) => mutationFn(params, signal),
      { ...options, ...overrideOptions }
    )
  }, [execute, mutationFn, options])

  return {
    ...rest,
    mutate
  }
}

export const useApiQuery = <T = any>(
  queryFn: (signal?: AbortSignal) => Promise<T>,
  options?: ApiRequestOptions & {
    enabled?: boolean
    refetchInterval?: number
  }
) => {
  const { execute, ...rest } = useApiRequest<T>()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { enabled = true, refetchInterval, ...executeOptions } = options || {}

  const refetch = useCallback(() => {
    return execute(queryFn, executeOptions)
  }, [execute, queryFn, executeOptions])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refetch()
    }
  }, [enabled, refetch])

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(refetch, refetchInterval)
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refetchInterval, enabled, refetch])

  return {
    ...rest,
    refetch
  }
}

// Form submission hook with optimistic updates
export const useFormSubmission = <T = any, F = any>(
  submitFn: (formData: F, signal?: AbortSignal) => Promise<T>,
  options?: ApiRequestOptions & {
    resetFormOnSuccess?: boolean
  }
) => {
  const { mutate, ...rest } = useApiMutation(submitFn, {
    showSuccessToast: true,
    showErrorToast: true,
    successMessage: 'Form submitted successfully',
    errorMessage: 'Failed to submit form',
    ...options
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(async (formData: F, overrideOptions?: ApiRequestOptions) => {
    setIsSubmitting(true)
    try {
      await mutate(formData, overrideOptions)
    } finally {
      setIsSubmitting(false)
    }
  }, [mutate])

  return {
    ...rest,
    submit,
    isSubmitting: isSubmitting || rest.loading
  }
} 