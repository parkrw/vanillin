import { cn } from "../../lib/cn.js"
import { Controller, useFormContext } from "../../lib/use-form.js"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "../form/form.jsx"
import { Input } from "../input/input.jsx"
import { Textarea } from "../textarea/textarea.jsx"

/* ── control resolution ───────────────────────────────────────────── */

/**
 * Explicit `control` prop wins; otherwise fall back to the nearest
 * `<FormProvider>`. `useFormContext` throws when there is no provider, but
 * its `useContext` call has already run by the time it does — the hook order
 * is identical on both paths, so catching here is safe.
 */
function useBoundControl(control, name) {
  let context = null
  try {
    context = useFormContext()
  } catch {
    context = null
  }
  const resolved = control || context?.control
  if (!resolved) {
    throw new Error(
      `Field "${name}" needs a \`control\` prop or a <FormProvider> ancestor`
    )
  }
  return resolved
}

/* ── FormFieldBinding ─────────────────────────────────────────────── */

/**
 * The plumbing every bound field shares: FormField → FormItem → label,
 * control, description, message — with the engine wired in.
 *
 * `controlled` picks the value channel. Native inputs (`input`, `textarea`)
 * leave it off and get `register(...)` props; anything with its own value
 * channel (Select, Checkbox, Switch, RadioGroup) sets it and gets a
 * `Controller`-managed `field`. The `<XField>` components below make that
 * choice so callers never have to.
 *
 * `render` receives `{ field, fieldState, formItemId, labelId }`. Wrap the
 * control in `<FormControl>` yourself — that is what stamps `id`,
 * `aria-describedby` and `aria-invalid` onto it.
 */
export function FormFieldBinding({ name, className, ...props }) {
  return (
    <FormField name={name}>
      <FormItem className={cn("form-field", className)}>
        <BoundField name={name} {...props} />
      </FormItem>
    </FormField>
  )
}

function BoundField({
  name,
  control,
  label,
  description,
  rules,
  defaultValue,
  controlled = false,
  layout = "stacked",
  render,
}) {
  const boundControl = useBoundControl(control, name)
  const { formItemId, error } = useFormField()
  const labelId = formItemId ? `${formItemId}-label` : undefined

  const labelNode =
    label == null ? null : <FormLabel id={labelId}>{label}</FormLabel>

  const controlNode = controlled ? (
    <Controller
      name={name}
      control={boundControl}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) =>
        render({ field, fieldState, formItemId, labelId })
      }
    />
  ) : (
    render({
      field: boundControl.register(name, rules),
      fieldState: { error, invalid: !!error },
      formItemId,
      labelId,
    })
  )

  return (
    <>
      {layout === "inline" ? (
        <div className="form-field-row">
          {controlNode}
          {labelNode}
        </div>
      ) : (
        <>
          {labelNode}
          {controlNode}
        </>
      )}
      {description == null ? null : (
        <FormDescription>{description}</FormDescription>
      )}
      <FormMessage />
    </>
  )
}

/* ── register-path fields ─────────────────────────────────────────── */

export function TextField({
  name,
  control,
  label,
  description,
  rules,
  ...props
}) {
  return (
    <FormFieldBinding
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      render={({ field }) => <FormControl as={Input} {...props} {...field} />}
    />
  )
}

export function TextareaField({
  name,
  control,
  label,
  description,
  rules,
  ...props
}) {
  return (
    <FormFieldBinding
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      render={({ field }) => <FormControl as={Textarea} {...props} {...field} />}
    />
  )
}
