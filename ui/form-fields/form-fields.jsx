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
import { Checkbox } from "../checkbox/checkbox.jsx"
import { Input } from "../input/input.jsx"
import { Label } from "../label/label.jsx"
import { RadioGroup, RadioGroupItem } from "../radio-group/radio-group.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select/select.jsx"
import { Switch } from "../switch/switch.jsx"
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

/* ── Controller-path fields ───────────────────────────────────────── */

/*
 * These four have a value channel the DOM does not carry, so `register`'s
 * ref/onChange pair cannot see them: Select, Checkbox and Switch render
 * buttons, RadioGroup a div. `Controller` owns their value instead.
 * `field.ref` is deliberately not forwarded — it would hand the engine a
 * <button> to read a `value` off, and Controller-managed fields are skipped
 * by the DOM read anyway.
 */

/**
 * `items` is `[{ value, label, disabled? }]`. Pass `children` instead to
 * build the list yourself (groups, separators, custom items).
 */
export function SelectField({
  name,
  control,
  label,
  description,
  rules,
  defaultValue = "",
  placeholder,
  items,
  children,
  ...props
}) {
  return (
    <FormFieldBinding
      controlled
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field }) => (
        <Select value={field.value ?? ""} onValueChange={field.onChange}>
          <FormControl as={SelectTrigger} onBlur={field.onBlur} {...props}>
            <SelectValue placeholder={placeholder} />
          </FormControl>
          <SelectContent>
            {children ??
              items?.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                >
                  {item.label ?? item.value}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

export function CheckboxField({
  name,
  control,
  label,
  description,
  rules,
  defaultValue = false,
  ...props
}) {
  return (
    <FormFieldBinding
      controlled
      layout="inline"
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormControl
          as={Checkbox}
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          {...props}
        />
      )}
    />
  )
}

export function SwitchField({
  name,
  control,
  label,
  description,
  rules,
  defaultValue = false,
  ...props
}) {
  return (
    <FormFieldBinding
      controlled
      layout="inline"
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormControl
          as={Switch}
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          {...props}
        />
      )}
    />
  )
}

/**
 * `items` is `[{ value, label, disabled? }]`. The group is a div, so
 * `FormLabel`'s `htmlFor` cannot reach it — `aria-labelledby` does the work.
 */
export function RadioGroupField({
  name,
  control,
  label,
  description,
  rules,
  defaultValue = "",
  items = [],
  ...props
}) {
  return (
    <FormFieldBinding
      controlled
      name={name}
      control={control}
      label={label}
      description={description}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, formItemId, labelId }) => (
        <FormControl
          as={RadioGroup}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          aria-labelledby={labelId}
          {...props}
        >
          {items.map((item) => {
            const itemId = `${formItemId}-${item.value}`
            return (
              <div className="form-field-option" key={item.value}>
                <RadioGroupItem
                  id={itemId}
                  value={item.value}
                  disabled={item.disabled}
                />
                <Label htmlFor={itemId}>{item.label ?? item.value}</Label>
              </div>
            )
          })}
        </FormControl>
      )}
    />
  )
}
