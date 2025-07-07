import { z } from 'zod'
import { useState, useCallback } from 'react'

// Base validation rules
export const ValidationRules = {
  required: (message = 'This field is required') => z.string().min(1, message),
  
  email: (message = 'Please enter a valid email address') => 
    z.string().email(message),
  
  phone: (message = 'Please enter a valid phone number') =>
    z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, message),
  
  password: (message = 'Password must be at least 8 characters with at least one uppercase, one lowercase, and one number') =>
    z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message),
  
  url: (message = 'Please enter a valid URL') =>
    z.string().url(message),
  
  number: (message = 'Please enter a valid number') =>
    z.number({ invalid_type_error: message }),
  
  positiveNumber: (message = 'Please enter a positive number') =>
    z.number().positive(message),
  
  integer: (message = 'Please enter a whole number') =>
    z.number().int(message),
  
  minLength: (min: number, message?: string) =>
    z.string().min(min, message || `Must be at least ${min} characters`),
  
  maxLength: (max: number, message?: string) =>
    z.string().max(max, message || `Must be no more than ${max} characters`),
  
  range: (min: number, max: number, message?: string) =>
    z.number().min(min).max(max, message || `Must be between ${min} and ${max}`),
  
  dateString: (message = 'Please enter a valid date') =>
    z.string().refine((val) => !isNaN(Date.parse(val)), { message }),
  
  futureDate: (message = 'Date must be in the future') =>
    z.string().refine((val) => new Date(val) > new Date(), { message }),
  
  pastDate: (message = 'Date must be in the past') =>
    z.string().refine((val) => new Date(val) < new Date(), { message }),
  
  currency: (message = 'Please enter a valid currency amount') =>
    z.number().min(0).multipleOf(0.01, message),
  
  zipCode: (message = 'Please enter a valid zip code') =>
    z.string().regex(/^\d{5}(-\d{4})?$/, message),
  
  strongPassword: (message = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character') =>
    z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, message),
  
  noSpaces: (message = 'This field cannot contain spaces') =>
    z.string().regex(/^\S*$/, message),
  
  alphanumeric: (message = 'Only letters and numbers are allowed') =>
    z.string().regex(/^[a-zA-Z0-9]*$/, message),
  
  slug: (message = 'Only lowercase letters, numbers, and hyphens are allowed') =>
    z.string().regex(/^[a-z0-9-]*$/, message),
}

// Common form schemas
export const CommonSchemas = {
  contact: z.object({
    firstName: ValidationRules.required('First name is required'),
    lastName: ValidationRules.required('Last name is required'),
    email: ValidationRules.email(),
    phone: ValidationRules.phone().optional(),
    company: z.string().optional(),
  }),
  
  address: z.object({
    street: ValidationRules.required('Street address is required'),
    city: ValidationRules.required('City is required'),
    state: ValidationRules.required('State is required'),
    zipCode: ValidationRules.zipCode(),
    country: ValidationRules.required('Country is required'),
  }),
  
  workOrder: z.object({
    title: ValidationRules.required('Work order title is required'),
    description: ValidationRules.required('Description is required'),
    priority: z.enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Please select a priority level' })
    }),
    dueDate: ValidationRules.dateString(),
    estimatedHours: ValidationRules.positiveNumber('Estimated hours must be a positive number').optional(),
    cost: ValidationRules.currency('Cost must be a valid currency amount').optional(),
  }),
  
  client: z.object({
    name: ValidationRules.required('Client name is required'),
    email: ValidationRules.email(),
    phone: ValidationRules.phone().optional(),
    company: z.string().optional(),
    address: CommonSchemas.address.optional(),
    notes: z.string().optional(),
  }),
  
  invoice: z.object({
    clientId: ValidationRules.required('Please select a client'),
    items: z.array(z.object({
      description: ValidationRules.required('Item description is required'),
      quantity: ValidationRules.positiveNumber('Quantity must be positive'),
      rate: ValidationRules.currency('Rate must be a valid currency amount'),
      amount: ValidationRules.currency('Amount must be a valid currency amount'),
    })).min(1, 'At least one item is required'),
    dueDate: ValidationRules.futureDate('Due date must be in the future'),
    notes: z.string().optional(),
  }),
  
  user: z.object({
    email: ValidationRules.email(),
    password: ValidationRules.password(),
    firstName: ValidationRules.required('First name is required'),
    lastName: ValidationRules.required('Last name is required'),
    role: z.enum(['admin', 'manager', 'worker'], {
      errorMap: () => ({ message: 'Please select a valid role' })
    }),
  }),
  
  settings: z.object({
    companyName: ValidationRules.required('Company name is required'),
    email: ValidationRules.email(),
    phone: ValidationRules.phone().optional(),
    address: CommonSchemas.address.optional(),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD'], {
      errorMap: () => ({ message: 'Please select a currency' })
    }),
    timezone: ValidationRules.required('Timezone is required'),
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
  }),
}

// Validation helper functions
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}

export const validateField = <T>(
  schema: z.ZodSchema<T>, 
  value: unknown
): { success: boolean; error?: string } => {
  try {
    schema.parse(value)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Form validation hook
export const useFormValidation = <T>(
  schema: z.ZodSchema<T>,
  initialData?: Partial<T>
) => {
  const [data, setData] = useState<Partial<T>>(initialData || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback((field: string, value: unknown) => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = schema.pick({ [field]: true } as any)
      fieldSchema.parse({ [field]: value })
      
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message || 'Validation failed'
        setErrors(prev => ({ ...prev, [field]: fieldError }))
        return false
      }
      return false
    }
  }, [schema])

  const validateAll = useCallback(() => {
    const result = validateForm(schema, data)
    if (result.success) {
      setErrors({})
      return true
    } else {
      setErrors(result.errors || {})
      return false
    }
  }, [schema, data])

  const setValue = useCallback((field: string, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validate field if it has been touched
    if (touched[field]) {
      validateField(field, value)
    }
  }, [touched, validateField])

  const setTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const reset = useCallback(() => {
    setData(initialData || {})
    setErrors({})
    setTouched({})
  }, [initialData])

  const getFieldProps = useCallback((field: string) => ({
    value: data[field as keyof T] || '',
    onChange: (value: unknown) => setValue(field, value),
    onBlur: () => {
      setTouched(field)
      validateField(field, data[field as keyof T])
    },
    error: touched[field] ? errors[field] : undefined,
    touched: touched[field] || false,
  }), [data, errors, touched, setValue, validateField])

  return {
    data,
    errors,
    touched,
    setValue,
    setTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  }
}

// Export commonly used validation combinations
export const createCustomValidation = (rules: Array<z.ZodSchema<any>>) => {
  return rules.reduce((acc, rule) => acc.and(rule), z.any())
}

export const conditionalValidation = <T>(
  condition: (data: T) => boolean,
  schema: z.ZodSchema<any>
) => {
  return z.any().refine((data) => {
    if (condition(data)) {
      return schema.safeParse(data).success
    }
    return true
  })
} 