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
import { FieldDescription, FieldError } from "../field/field.jsx"
import { Label } from "../label/label.jsx"

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
    <Label
      htmlFor={formItemId}
      className={cn("form-label", error && "form-label--error", className)}
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
    <FieldDescription
      id={formDescriptionId}
      className={cn("form-description", className)}
      {...props}
    />
  )
}

/* ── FormMessage ──────────────────────────────────────────────────── */

export function FormMessage({ className, children, ...props }) {
  const { error, formMessageId } = useFormField()
  // The engine's error wins over children — the opposite of FieldError's own
  // precedence, so resolve here and hand it a single body. FieldError renders
  // nothing when the body is empty.
  const body = error?.message || children

  return (
    <FieldError
      as="p"
      id={formMessageId}
      className={cn("form-message", className)}
      {...props}
    >
      {body}
    </FieldError>
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
