import {
  Children,
  cloneElement,
  createContext,
  createElement,
  useActionState,
  useContext,
  useId,
} from "react"
import { useFormStatus } from "react-dom"
import { cn } from "../../lib/cn.js"

/* ── path helper (inlined — ui/form must never import lib/use-form) ── */

function getByPath(obj, path) {
  if (obj == null || !path) return undefined
  return path.split(".").reduce((cur, key) => cur?.[key], obj)
}

/* ── contexts ─────────────────────────────────────────────────────── */

const FormContext = createContext(null)
const FormFieldContext = createContext(null)
const FormItemContext = createContext(null)

/* ── useFormField ─────────────────────────────────────────────────── */

export function useFormField() {
  const form = useContext(FormContext)
  const field = useContext(FormFieldContext)
  const item = useContext(FormItemContext)

  if (!field) {
    throw new Error("useFormField must be used within a FormField")
  }

  const { name } = field
  const { id } = item || {}
  const raw = getByPath(form?.formState?.errors, name)
  const error =
    raw && typeof raw === "object" && "message" in raw ? raw : undefined

  return {
    name,
    id,
    formItemId: id ? `${id}-form-item` : undefined,
    formDescriptionId: id ? `${id}-form-item-description` : undefined,
    formMessageId: id ? `${id}-form-item-message` : undefined,
    error,
  }
}

/* ── Form ─────────────────────────────────────────────────────────── */

export function Form({ form, action, className, children, ...props }) {
  if (action) {
    return (
      <ActionForm action={action} className={className} {...props}>
        {children}
      </ActionForm>
    )
  }

  const formState = form?.formState || { errors: {} }
  return (
    <FormContext.Provider value={{ formState }}>
      <form className={cn("form", className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

/** Internal component — uses useActionState (hook rules require a stable component). */
function ActionForm({ action, className, children, ...props }) {
  const [state, formAction] = useActionState(action, null)
  const formState = {
    errors: state?.errors || {},
    isSubmitting: false,
  }
  return (
    <FormContext.Provider value={{ formState }}>
      <form action={formAction} className={cn("form", className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

/* ── FormField ────────────────────────────────────────────────────── */

export function FormField({ name, children }) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {children}
    </FormFieldContext.Provider>
  )
}

/* ── FormItem ─────────────────────────────────────────────────────── */

export function FormItem({ className, ...props }) {
  const id = useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("form-item", className)} {...props} />
    </FormItemContext.Provider>
  )
}

/* ── FormLabel ────────────────────────────────────────────────────── */

export function FormLabel({ className, ...props }) {
  const { formItemId, error } = useFormField()
  return (
    <label
      htmlFor={formItemId}
      className={cn("label", "form-label", error && "form-label--error", className)}
      data-error={error ? "" : undefined}
      {...props}
    />
  )
}

/* ── FormControl ──────────────────────────────────────────────────── */

export function FormControl({ as: Component, children, ...props }) {
  const { formItemId, formDescriptionId, formMessageId, error } = useFormField()

  const describedBy =
    [formDescriptionId, error ? formMessageId : null]
      .filter(Boolean)
      .join(" ") || undefined

  const ariaProps = {
    id: formItemId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  }

  if (Component) {
    return createElement(Component, { ...ariaProps, ...props }, children)
  }

  const child = Children.only(children)
  return cloneElement(child, ariaProps)
}

/* ── FormDescription ──────────────────────────────────────────────── */

export function FormDescription({ className, ...props }) {
  const { formDescriptionId } = useFormField()
  return (
    <p
      id={formDescriptionId}
      className={cn("form-description", className)}
      {...props}
    />
  )
}

/* ── FormMessage ──────────────────────────────────────────────────── */

export function FormMessage({ className, children, ...props }) {
  const { error, formMessageId } = useFormField()
  const body = error?.message || children

  if (!body) return null

  return (
    <p
      id={formMessageId}
      role="alert"
      className={cn("form-message", className)}
      {...props}
    >
      {body}
    </p>
  )
}

/* ── FormSubmit ────────────────────────────────────────────────────── */

export function FormSubmit({
  className,
  pending: pendingContent,
  children,
  ...props
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={cn("form-submit", className)}
      disabled={pending}
      aria-disabled={pending || undefined}
      data-pending={pending ? "" : undefined}
      {...props}
    >
      {pending && pendingContent ? pendingContent : children}
    </button>
  )
}
