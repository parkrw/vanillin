import { createContext, useContext } from "react"

const DirectionContext = createContext("ltr")
const LocaleContext = createContext(undefined)

/** Provide text direction ("ltr" | "rtl") and locale to descendant components. */
export function DirectionProvider({ dir = "ltr", locale, children }) {
  return (
    <DirectionContext.Provider value={dir}>
      <LocaleContext.Provider value={locale}>
        <div dir={dir} style={{ display: "contents" }}>
          {children}
        </div>
      </LocaleContext.Provider>
    </DirectionContext.Provider>
  )
}

export function useDirection() {
  return useContext(DirectionContext)
}

/** Returns the locale from the nearest DirectionProvider, or undefined (runtime default). */
export function useLocale() {
  return useContext(LocaleContext)
}
