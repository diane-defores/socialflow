export function applyDisableCopyProtection() {
  const blockEvent = (event: Event) => {
    event.preventDefault()
  }

  document.addEventListener("copy", blockEvent)
  document.addEventListener("cut", blockEvent)
  document.addEventListener("contextmenu", blockEvent)
  document.addEventListener("selectstart", blockEvent)
  document.addEventListener("dragstart", blockEvent)

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return
    }

    const key = event.key.toLowerCase()
    if (["a", "c", "u", "x"].includes(key)) {
      event.preventDefault()
    }
  })
}
