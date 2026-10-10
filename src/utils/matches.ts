export function matches(current: readonly unknown[], next: readonly unknown[]) {
  return current.length === next.length && next.every((id) => current.includes(id))
}
