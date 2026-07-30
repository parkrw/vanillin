import { createContext, createElement, useContext, useEffect, useRef, useState } from "react"

/**
 * Zero-dep form engine shaped like react-hook-form. Mirrors the RHF
 * surface consumers actually reach for:
 *
 *   useForm         main hook — defaultValues, mode, reValidateMode, resolver
 *   register        uncontrolled binding — { name, ref, onChange, onBlur }
 *   handleSubmit    (onValid, onInvalid?) => event handler
 *   watch           subscribe to field value changes (triggers re-render)
 *   getValues       read values without subscribing
 *   setValue        imperatively set a field value
 *   reset           restore form to default values
 *   setError        manually set a field error
 *   clearErrors     clear one, some, or all errors
 *   trigger         run validation without submitting
 *   formState       { errors, isDirty, dirtyFields, touchedFields,
 *                     isSubmitting, isSubmitted, isValid, submitCount }
 *   control         pass to Controller / useFieldArray / FormProvider
 *   Controller      controlled-component escape hatch (for components
 *                   that own their state, e.g. our Select, Combobox,
 *                   Calendar, Checkbox — all useControllableState-based)
 *   FormProvider    context provider wrapping a form
 *   useFormContext  read form methods from context
 *   useFieldArray   dynamic arrays — append, prepend, remove, insert,
 *                   swap, move, update, replace
 *
 * Resolver contract: async (values, context, options) => { values, errors }
 *   options = { fields, names, criteriaMode, shouldUseNativeValidation }
 *   errors keyed by dotted path, each { type, message }.
 *   Compatible with @hookform/resolvers — verified once against
 *   @hookform/resolvers 5.5.3 + zod 4.4.3 on 2026-07-26. Neither
 *   package is a dependency of this repo.
 *
 * Performance property: register is uncontrolled — typing in one field
 * does NOT re-render siblings. Values are stored in a mutable ref, not
 * React state. Only watch and formState access trigger re-renders, and
 * only for the slices actually read (proxy-tracked for formState).
 *
 * Out of scope (deliberate divergences from RHF):
 *   shouldUnregister, criteriaMode "all", setFocus,
 *   getFieldState subscriptions, delayError, devtools, native validation.
 *
 * Path helpers (getByPath, setByPath, unsetByPath) are exported for
 * reuse and are tested directly.
 */

/* ================================================================== */
/*  Path helpers — dotted-path get / set / unset for nested objects     */
/* ================================================================== */

/**
 * Read a value at a dotted path.
 *   getByPath({ a: { b: [1, 2] } }, "a.b.1") => 2
 */
export function getByPath(obj, path) {
  if (obj == null) return undefined
  if (!path) return obj
  const keys = path.split(".")
  let cur = obj
  for (const k of keys) {
    if (cur == null) return undefined
    cur = cur[k]
  }
  return cur
}

/**
 * Set a value at a dotted path (mutates `obj` in place).
 * Creates intermediate objects or arrays depending on whether the next
 * segment is numeric.
 *   const o = {}; setByPath(o, "a.0.b", 1) => o = { a: [{ b: 1 }] }
 */
export function setByPath(obj, path, value) {
  if (!path || obj == null) return
  const keys = path.split(".")
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (cur[k] == null || typeof cur[k] !== "object") {
      cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    }
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
}

/**
 * Delete a value at a dotted path (mutates). Prunes empty ancestors so
 * `unsetByPath({ a: { b: 1 } }, "a.b")` leaves `{}`, not `{ a: {} }`.
 */
export function unsetByPath(obj, path) {
  if (!path || obj == null) return
  const keys = path.split(".")
  const stack = [obj]
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== "object") return
    cur = cur[keys[i]]
    stack.push(cur)
  }
  delete cur[keys[keys.length - 1]]
  // Prune empty ancestors
  for (let i = keys.length - 2; i >= 0; i--) {
    const child = stack[i][keys[i]]
    if (child && typeof child === "object" && Object.keys(child).length === 0) {
      delete stack[i][keys[i]]
    } else break
  }
}

/* ================================================================== */
/*  Internal utilities                                                 */
/* ================================================================== */

function deepClone(v) {
  if (v == null || typeof v !== "object") return v
  if (v instanceof Date) return new Date(v)
  if (Array.isArray(v)) return v.map(deepClone)
  const out = {}
  for (const k of Object.keys(v)) out[k] = deepClone(v[k])
  return out
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object")
    return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => deepEqual(a[k], b[k]))
}

/** True when the errors object contains no leaf error nodes. */
function isEmptyErrors(errors) {
  if (!errors || typeof errors !== "object") return true
  for (const key of Object.keys(errors)) {
    const val = errors[key]
    if (val != null && typeof val === "object") {
      if ("type" in val && "message" in val) return false
      if (!isEmptyErrors(val)) return false
    }
  }
  return true
}

function snapshotState(s) {
  return {
    errors: deepClone(s.errors),
    isDirty: s.isDirty,
    dirtyFields: deepClone(s.dirtyFields),
    touchedFields: deepClone(s.touchedFields),
    isSubmitting: s.isSubmitting,
    isSubmitted: s.isSubmitted,
    isValid: s.isValid,
    submitCount: s.submitCount,
  }
}

/* ================================================================== */
/*  createFormControl — the engine behind useForm                      */
/* ================================================================== */

function createFormControl(opts = {}) {
  const {
    defaultValues: rawDefaults = {},
    mode = "onSubmit",
    reValidateMode = "onChange",
    resolver,
    context,
  } = opts

  /* ── mutable internal stores (never React state) ───────────── */

  const _defaultValues = deepClone(rawDefaults)
  const _values = deepClone(rawDefaults)
  const _fields = {} // { [name]: { _ref, _options } }
  const _formState = {
    errors: {},
    isDirty: false,
    dirtyFields: {},
    touchedFields: {},
    isSubmitting: false,
    isSubmitted: false,
    isValid: true,
    submitCount: 0,
  }

  /* ── subscription channels ─────────────────────────────────── */

  const _valueListeners = new Set()
  const _stateListeners = new Set()
  const _notifyValues = (name) => _valueListeners.forEach((fn) => fn(name))
  const _notifyState = () => _stateListeners.forEach((fn) => fn())

  /* ── DOM ref helpers ───────────────────────────────────────── */

  function _getRefValue(ref) {
    if (!ref) return undefined
    if (ref.type === "checkbox") return ref.checked
    return ref.value
  }

  function _setRefValue(ref, value) {
    if (!ref) return
    if (ref.type === "checkbox") ref.checked = !!value
    else ref.value = value ?? ""
  }

  /* ── dirty tracking ────────────────────────────────────────── */

  function _updateDirty(name) {
    const cur = getByPath(_values, name)
    const def = getByPath(_defaultValues, name)
    if (!deepEqual(cur, def)) setByPath(_formState.dirtyFields, name, true)
    else unsetByPath(_formState.dirtyFields, name)
    _formState.isDirty = !deepEqual(_values, _defaultValues)
  }

  /* ── validation-mode predicates ────────────────────────────── */

  function _shouldValidateOnChange(name) {
    if (_formState.isSubmitted) return reValidateMode === "onChange"
    if (mode === "onChange" || mode === "all") return true
    if (mode === "onTouched" && getByPath(_formState.touchedFields, name))
      return true
    return false
  }

  function _shouldValidateOnBlur(name) {
    if (_formState.isSubmitted) return reValidateMode === "onBlur"
    return mode === "onBlur" || mode === "all" || mode === "onTouched"
  }

  /* ── read latest values off every registered DOM ref ────────── */

  function _readValuesFromDOM() {
    for (const [name, field] of Object.entries(_fields)) {
      if (field._controlled) continue // Controller manages its own value
      if (field._ref?.nodeName) {
        const val = _getRefValue(field._ref)
        if (val !== undefined) setByPath(_values, name, val)
      }
    }
  }

  /* ── validation engine ─────────────────────────────────────── */

  async function _runResolver() {
    if (!resolver) return null
    return resolver(deepClone(_values), context, {
      criteriaMode: "firstError",
      fields: _fields,
      names: Object.keys(_fields),
      shouldUseNativeValidation: false,
    })
  }

  async function _validateBuiltIn(name) {
    const field = _fields[name]
    if (!field) return true
    const rules = field._options || {}
    const value = getByPath(_values, name)

    // required
    if (rules.required) {
      const msg =
        typeof rules.required === "string"
          ? rules.required
          : "This field is required"
      if (value == null || value === "" || value === false) {
        setByPath(_formState.errors, name, {
          type: "required",
          message: msg,
        })
        return false
      }
    }

    // minLength
    if (rules.minLength != null && typeof value === "string") {
      const limit =
        typeof rules.minLength === "object"
          ? rules.minLength.value
          : rules.minLength
      const msg =
        typeof rules.minLength === "object"
          ? rules.minLength.message
          : `Min length is ${limit}`
      if (value.length < limit) {
        setByPath(_formState.errors, name, { type: "minLength", message: msg })
        return false
      }
    }

    // maxLength
    if (rules.maxLength != null && typeof value === "string") {
      const limit =
        typeof rules.maxLength === "object"
          ? rules.maxLength.value
          : rules.maxLength
      const msg =
        typeof rules.maxLength === "object"
          ? rules.maxLength.message
          : `Max length is ${limit}`
      if (value.length > limit) {
        setByPath(_formState.errors, name, { type: "maxLength", message: msg })
        return false
      }
    }

    // min
    if (rules.min != null) {
      const limit =
        typeof rules.min === "object" ? rules.min.value : rules.min
      const msg =
        typeof rules.min === "object"
          ? rules.min.message
          : `Minimum is ${limit}`
      if (Number(value) < Number(limit)) {
        setByPath(_formState.errors, name, { type: "min", message: msg })
        return false
      }
    }

    // max
    if (rules.max != null) {
      const limit =
        typeof rules.max === "object" ? rules.max.value : rules.max
      const msg =
        typeof rules.max === "object"
          ? rules.max.message
          : `Maximum is ${limit}`
      if (Number(value) > Number(limit)) {
        setByPath(_formState.errors, name, { type: "max", message: msg })
        return false
      }
    }

    // pattern
    if (rules.pattern) {
      const regex =
        rules.pattern instanceof RegExp
          ? rules.pattern
          : typeof rules.pattern === "object"
            ? rules.pattern.value
            : new RegExp(rules.pattern)
      const msg =
        typeof rules.pattern === "object" && !(rules.pattern instanceof RegExp)
          ? rules.pattern.message
          : "Invalid format"
      if (typeof value === "string" && value && !regex.test(value)) {
        setByPath(_formState.errors, name, { type: "pattern", message: msg })
        return false
      }
    }

    // validate (function or object of functions)
    if (rules.validate) {
      if (typeof rules.validate === "function") {
        const r = await rules.validate(value, _values)
        if (r !== true && r != null) {
          setByPath(_formState.errors, name, {
            type: "validate",
            message: typeof r === "string" ? r : "Validation failed",
          })
          return false
        }
      } else if (typeof rules.validate === "object") {
        for (const [vk, fn] of Object.entries(rules.validate)) {
          const r = await fn(value, _values)
          if (r !== true && r != null) {
            setByPath(_formState.errors, name, {
              type: vk,
              message: typeof r === "string" ? r : "Validation failed",
            })
            return false
          }
        }
      }
    }

    // Passed — clear any stale error for this field
    unsetByPath(_formState.errors, name)
    return true
  }

  /** Validate one field; with a resolver this re-runs the full resolver. */
  async function _validateField(name) {
    if (resolver) {
      const result = await _runResolver()
      _formState.errors = result.errors || {}
      _formState.isValid = isEmptyErrors(_formState.errors)
      return !getByPath(_formState.errors, name)
    }
    const ok = await _validateBuiltIn(name)
    _formState.isValid = isEmptyErrors(_formState.errors)
    return ok
  }

  /** Validate every registered field. */
  async function _validateAll() {
    if (resolver) {
      const result = await _runResolver()
      _formState.errors = result.errors || {}
      _formState.isValid = isEmptyErrors(_formState.errors)
      return _formState.isValid
    }
    _formState.errors = {}
    let allOk = true
    for (const name of Object.keys(_fields)) {
      if (!(await _validateBuiltIn(name))) allOk = false
    }
    _formState.isValid = allOk
    return allOk
  }

  /* ── public API ────────────────────────────────────────────── */

  function register(name, options = {}) {
    if (!_fields[name]) _fields[name] = { _ref: null, _options: options }
    else _fields[name]._options = options

    // Seed value from defaults or explicit option
    if (getByPath(_values, name) === undefined) {
      const v = options.value ?? getByPath(_defaultValues, name)
      if (v !== undefined) setByPath(_values, name, v)
    }

    return {
      name,
      ref(el) {
        if (el) {
          _fields[name]._ref = el
          const v = getByPath(_values, name)
          if (v != null) _setRefValue(el, v)
        }
      },
      onChange: async (e) => {
        const v = options.valueAsNumber
          ? e.target.valueAsNumber
          : options.valueAsDate
            ? e.target.valueAsDate
            : e.target.type === "checkbox"
              ? e.target.checked
              : e.target.value
        setByPath(_values, name, v)
        _updateDirty(name)
        _notifyValues(name)
        if (_shouldValidateOnChange(name)) {
          await _validateField(name)
        }
        _notifyState()
        options.onChange?.(e)
      },
      onBlur: async (e) => {
        setByPath(_formState.touchedFields, name, true)
        if (_shouldValidateOnBlur(name)) {
          await _validateField(name)
        }
        _notifyState()
        options.onBlur?.(e)
      },
      ...(options.disabled ? { disabled: true } : {}),
    }
  }

  function handleSubmit(onValid, onInvalid) {
    return async (e) => {
      e?.preventDefault?.()
      _readValuesFromDOM()
      _formState.isSubmitting = true
      _formState.submitCount++
      _notifyState()

      try {
        if (resolver) {
          const result = await _runResolver()
          _formState.errors = result.errors || {}
          _formState.isValid = isEmptyErrors(_formState.errors)
          _formState.isSubmitted = true
          if (_formState.isValid) {
            await onValid(result.values ?? deepClone(_values), e)
          } else {
            await onInvalid?.(_formState.errors, e)
          }
        } else {
          const ok = await _validateAll()
          _formState.isSubmitted = true
          if (ok) {
            await onValid(deepClone(_values), e)
          } else {
            await onInvalid?.(_formState.errors, e)
          }
        }
      } finally {
        _formState.isSubmitting = false
        _notifyState()
      }
    }
  }

  function getValues(name) {
    if (name === undefined) return deepClone(_values)
    if (Array.isArray(name)) return name.map((n) => getByPath(_values, n))
    return getByPath(_values, name)
  }

  function setValue(name, value, options = {}) {
    setByPath(_values, name, value)
    const field = _fields[name]
    if (field?._ref) _setRefValue(field._ref, value)
    if (options.shouldDirty) _updateDirty(name)
    _notifyValues(name)
    if (options.shouldValidate) {
      _validateField(name).then(() => _notifyState())
    } else if (options.shouldDirty) {
      _notifyState()
    }
  }

  function reset(values, options = {}) {
    const next =
      values !== undefined ? deepClone(values) : deepClone(_defaultValues)
    // Replace _values in place (keep reference)
    for (const k of Object.keys(_values)) delete _values[k]
    Object.assign(_values, next)
    if (!options.keepDefaultValues) {
      for (const k of Object.keys(_defaultValues)) delete _defaultValues[k]
      Object.assign(_defaultValues, deepClone(next))
    }
    for (const [n, f] of Object.entries(_fields)) {
      if (f._ref) _setRefValue(f._ref, getByPath(next, n))
    }
    if (!options.keepErrors) _formState.errors = {}
    if (!options.keepDirty) {
      _formState.isDirty = false
      _formState.dirtyFields = {}
    }
    if (!options.keepTouched) _formState.touchedFields = {}
    if (!options.keepIsSubmitted) _formState.isSubmitted = false
    _formState.isValid = true
    _notifyState()
    _notifyValues("_all")
  }

  function setError(name, error) {
    setByPath(_formState.errors, name, {
      type: error.type ?? "manual",
      message: error.message ?? "",
      ...(error.ref ? { ref: error.ref } : {}),
    })
    _formState.isValid = false
    _notifyState()
  }

  function clearErrors(name) {
    if (name === undefined) _formState.errors = {}
    else if (Array.isArray(name))
      name.forEach((n) => unsetByPath(_formState.errors, n))
    else unsetByPath(_formState.errors, name)
    _formState.isValid = isEmptyErrors(_formState.errors)
    _notifyState()
  }

  async function trigger(name) {
    _readValuesFromDOM()
    let result
    if (name === undefined) {
      result = await _validateAll()
    } else if (Array.isArray(name)) {
      result = true
      for (const n of name)
        if (!(await _validateField(n))) result = false
      _formState.isValid = isEmptyErrors(_formState.errors)
    } else {
      result = await _validateField(name)
    }
    _notifyState()
    return result
  }

  /* ── control object ────────────────────────────────────────── */

  return {
    _values,
    _defaultValues,
    _fields,
    _formState,
    _valueListeners,
    _stateListeners,
    _notifyValues,
    _notifyState,
    _validateField,
    _updateDirty,
    _shouldValidateOnChange,
    _shouldValidateOnBlur,
    _options: opts,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    setError,
    clearErrors,
    trigger,
  }
}

/* ================================================================== */
/*  useForm                                                            */
/* ================================================================== */

export function useForm(options = {}) {
  const controlRef = useRef(null)
  if (!controlRef.current) controlRef.current = createFormControl(options)
  const control = controlRef.current

  // Track which formState properties the consumer reads (via proxy)
  const readRef = useRef({})
  // Track which field names are watched
  const watchedRef = useRef(new Set())
  // Snapshot for diffing formState changes
  const snapRef = useRef(snapshotState(control._formState))
  const [, bump] = useState(0)

  useEffect(() => {
    const onValue = (name) => {
      if (
        watchedRef.current.has("_all") ||
        watchedRef.current.has(name) ||
        name === "_all"
      ) {
        bump((c) => c + 1)
      }
    }
    const onState = () => {
      const prev = snapRef.current
      const cur = control._formState
      for (const key of Object.keys(readRef.current)) {
        if (!readRef.current[key]) continue
        if (
          key === "errors" ||
          key === "dirtyFields" ||
          key === "touchedFields"
        ) {
          if (!deepEqual(prev[key], cur[key])) {
            snapRef.current = snapshotState(cur)
            bump((c) => c + 1)
            return
          }
        } else if (prev[key] !== cur[key]) {
          snapRef.current = snapshotState(cur)
          bump((c) => c + 1)
          return
        }
      }
    }
    control._valueListeners.add(onValue)
    control._stateListeners.add(onState)
    return () => {
      control._valueListeners.delete(onValue)
      control._stateListeners.delete(onState)
    }
  }, [control])

  function watch(nameOrNames, defaultValue) {
    // Callback form: watch((values, { name }) => { ... })
    if (typeof nameOrNames === "function") {
      const cb = nameOrNames
      const listener = (name) =>
        cb(deepClone(control._values), { name, type: "change" })
      control._valueListeners.add(listener)
      return () => control._valueListeners.delete(listener)
    }
    // No argument: watch everything
    if (nameOrNames === undefined) {
      watchedRef.current.add("_all")
      return deepClone(control._values)
    }
    // Array of names
    if (Array.isArray(nameOrNames)) {
      for (const n of nameOrNames) watchedRef.current.add(n)
      return nameOrNames.map((n) => getByPath(control._values, n))
    }
    // Single name
    watchedRef.current.add(nameOrNames)
    const v = getByPath(control._values, nameOrNames)
    return v !== undefined ? v : defaultValue
  }

  const formState = new Proxy(control._formState, {
    get(target, prop) {
      if (typeof prop === "string") readRef.current[prop] = true
      return target[prop]
    },
  })

  return {
    register: control.register,
    handleSubmit: control.handleSubmit,
    watch,
    setValue: control.setValue,
    getValues: control.getValues,
    reset: control.reset,
    setError: control.setError,
    clearErrors: control.clearErrors,
    trigger: control.trigger,
    control,
    formState,
  }
}

/* ================================================================== */
/*  Controller — controlled-component escape hatch                     */
/* ================================================================== */

export function Controller({ name, control, render, defaultValue, rules }) {
  const [, bump] = useState(0)

  useEffect(() => {
    if (!control._fields[name]) {
      control._fields[name] = { _ref: null, _options: rules || {}, _controlled: true }
    } else {
      control._fields[name]._controlled = true
    }
    const onValue = (n) => {
      if (n === name || n === "_all") bump((c) => c + 1)
    }
    const onState = () => bump((c) => c + 1)
    control._valueListeners.add(onValue)
    control._stateListeners.add(onState)
    return () => {
      control._valueListeners.delete(onValue)
      control._stateListeners.delete(onState)
    }
  }, [control, name, rules])

  const value = getByPath(control._values, name) ?? defaultValue

  const field = {
    name,
    value,
    onChange(eventOrValue) {
      const v = eventOrValue?.target?.nodeName
        ? eventOrValue.target.type === "checkbox"
          ? eventOrValue.target.checked
          : eventOrValue.target.value
        : eventOrValue
      setByPath(control._values, name, v)
      control._updateDirty(name)
      control._notifyValues(name)
      if (control._shouldValidateOnChange(name)) {
        control._validateField(name).then(() => control._notifyState())
      }
    },
    onBlur() {
      setByPath(control._formState.touchedFields, name, true)
      if (control._shouldValidateOnBlur(name)) {
        control._validateField(name).then(() => control._notifyState())
      } else {
        control._notifyState()
      }
    },
    ref(el) {
      if (el && control._fields[name]) control._fields[name]._ref = el
    },
  }

  const fieldState = {
    error: getByPath(control._formState.errors, name),
    isDirty: !!getByPath(control._formState.dirtyFields, name),
    isTouched: !!getByPath(control._formState.touchedFields, name),
    invalid: !!getByPath(control._formState.errors, name),
  }

  return render({ field, fieldState, formState: control._formState })
}

/* ================================================================== */
/*  FormProvider / useFormContext                                       */
/* ================================================================== */

export const FormContext = createContext(null)

export function FormProvider({ children, ...methods }) {
  return createElement(FormContext.Provider, { value: methods }, children)
}

export function useFormContext() {
  const ctx = useContext(FormContext)
  if (!ctx)
    throw new Error("useFormContext must be used within a FormProvider")
  return ctx
}

/**
 * Returns `null` outside a provider instead of throwing, for components that
 * take an explicit `control` prop as an alternative to context.
 */
export function useFormContextSafe() {
  return useContext(FormContext)
}

/* ================================================================== */
/*  useFieldArray                                                      */
/* ================================================================== */

let _faId = 0

export function useFieldArray({ control, name, keyName = "id" }) {
  const [, bump] = useState(0)
  const idsRef = useRef([])

  function getArr() {
    return getByPath(control._values, name) || []
  }

  function syncIds() {
    const arr = getArr()
    while (idsRef.current.length < arr.length)
      idsRef.current.push(`_fa_${++_faId}`)
    idsRef.current.length = arr.length
  }
  syncIds()

  useEffect(() => {
    const listener = (n) => {
      if (n === name || n.startsWith(name + ".") || n === "_all") {
        syncIds()
        bump((c) => c + 1)
      }
    }
    control._valueListeners.add(listener)
    return () => control._valueListeners.delete(listener)
  }, [control, name])

  function _commit(arr) {
    setByPath(control._values, name, arr)
    control._updateDirty(name)
    syncIds()
    control._notifyValues(name)
    control._notifyState()
  }

  const fields = getArr().map((item, i) => ({
    ...(typeof item === "object" && item !== null ? item : {}),
    [keyName]: idsRef.current[i],
  }))

  function append(value) {
    const arr = [...getArr()]
    const items = Array.isArray(value) ? value : [value]
    for (const v of items) {
      arr.push(deepClone(v))
      idsRef.current.push(`_fa_${++_faId}`)
    }
    _commit(arr)
  }

  function prepend(value) {
    const arr = [...getArr()]
    const items = Array.isArray(value) ? value : [value]
    for (let i = items.length - 1; i >= 0; i--) {
      arr.unshift(deepClone(items[i]))
      idsRef.current.unshift(`_fa_${++_faId}`)
    }
    _commit(arr)
  }

  function remove(index) {
    const arr = [...getArr()]
    if (index === undefined) {
      arr.length = 0
      idsRef.current.length = 0
    } else if (Array.isArray(index)) {
      ;[...index]
        .sort((a, b) => b - a)
        .forEach((i) => {
          arr.splice(i, 1)
          idsRef.current.splice(i, 1)
        })
    } else {
      arr.splice(index, 1)
      idsRef.current.splice(index, 1)
    }
    _commit(arr)
  }

  function insert(index, value) {
    const arr = [...getArr()]
    const items = Array.isArray(value) ? value : [value]
    arr.splice(index, 0, ...items.map(deepClone))
    idsRef.current.splice(
      index,
      0,
      ...items.map(() => `_fa_${++_faId}`)
    )
    _commit(arr)
  }

  function swap(from, to) {
    const arr = [...getArr()]
    ;[arr[from], arr[to]] = [arr[to], arr[from]]
    ;[idsRef.current[from], idsRef.current[to]] = [
      idsRef.current[to],
      idsRef.current[from],
    ]
    _commit(arr)
  }

  function move(from, to) {
    const arr = [...getArr()]
    const [item] = arr.splice(from, 1)
    const [id] = idsRef.current.splice(from, 1)
    arr.splice(to, 0, item)
    idsRef.current.splice(to, 0, id)
    _commit(arr)
  }

  function update(index, value) {
    const arr = [...getArr()]
    arr[index] = deepClone(value)
    _commit(arr)
  }

  function replace(values) {
    idsRef.current = values.map(() => `_fa_${++_faId}`)
    _commit(values.map(deepClone))
  }

  return {
    fields,
    append,
    prepend,
    remove,
    insert,
    swap,
    move,
    update,
    replace,
  }
}
