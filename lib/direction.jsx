import { createContext, useContext } from "react"

const DirectionContext = createContext("ltr")

/** Provide text direction ("ltr" | "rtl") to descendant components. */
export function DirectionProvider({ dir = "ltr", children }) {
  return (
    <DirectionContext.Provider value={dir}>
      <div dir={dir} style={{ display: "contents" }}>
        {children}
      </div>
    </DirectionContext.Provider>
  )
}

export function useDirection() {
  return useContext(DirectionContext)
}
