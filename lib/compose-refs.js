/** Merge multiple refs (callback or object) into a single callback ref. */
export function composeRefs(...refs) {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref != null) ref.current = node
    }
  }
}
