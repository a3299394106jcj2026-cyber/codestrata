export function renderStatus(container, status) {
  if (!container) return

  container.innerHTML = ""

  if (!status) return

  const element = document.createElement("div")
  element.className = `status status--${status.kind ?? "info"}`
  element.setAttribute("role", "status")

  const title = document.createElement("strong")
  title.textContent = status.title

  const detail = document.createElement("p")
  detail.textContent = status.detail

  element.append(title, detail)

  if (status.action) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "status__action"
    button.textContent = status.action
    if (status.onAction) {
      button.addEventListener("click", status.onAction)
    }
    element.append(button)
  }

  if (status.meta) {
    const meta = document.createElement("small")
    meta.textContent = status.meta
    element.append(meta)
  }

  container.append(element)
}

export function renderSourceBadge(container, snapshot) {
  if (!container || !snapshot) return

  const labels = {
    live: "GitHub 实时数据",
    cache: "本地缓存",
    "offline-demo": "内置离线演示数据"
  }

  container.className = `source-badge source-badge--${snapshot.sourceType}`
  container.textContent = labels[snapshot.sourceType] ?? snapshot.sourceName

  if (snapshot.fetchedAt) {
    const time = new Date(snapshot.fetchedAt)
    container.textContent += ` · ${time.toISOString().slice(0, 16).replace("T", " ")} UTC`
  }
}
