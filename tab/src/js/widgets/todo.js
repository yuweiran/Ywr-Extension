(function () {
  if (typeof WidgetRegistry === "undefined") return;

  const table = () => ($indexedDB && $indexedDB.$tables ? $indexedDB.$tables.todos : null);

  const render = (slot) => {
    const t = table();
    if (!t) {
      slot.innerHTML = "";
      return;
    }
    t.list().then((items) => {
      const sorted = items.slice().sort((a, b) => a.done - b.done || a.id - b.id);
      slot.innerHTML = `
        <div class="widget-head">✓ 待办清单 <span class="todo-count">${items.filter((i) => i.done !== 1).length}</span></div>
        <ul class="todo-list">
          ${sorted
            .map(
              (it) => `<li class="todo-item${it.done === 1 ? " is-done" : ""}" data-id="${it.id}">
                <input type="checkbox" class="todo-check" data-id="${it.id}" ${it.done === 1 ? "checked" : ""}>
                <span class="todo-text">${escapeHtml(it.text)}</span>
                <button class="todo-del" data-id="${it.id}">✕</button>
              </li>`
            )
            .join("")}
        </ul>
        <form class="todo-form">
          <input class="todo-input" type="text" placeholder="添加待办…" maxlength="100">
          <button class="todo-add" type="submit">＋</button>
        </form>`;
      slot.querySelectorAll(".todo-check").forEach((cb) =>
        cb.addEventListener("change", async () => {
          const t2 = table();
          const row = (await t2.list()).find((r) => r.id === Number(cb.dataset.id));
          if (row) {
            await t2.update({ id: row.id, done: cb.checked ? 1 : 0 });
            render(slot);
          }
        })
      );
      slot.querySelectorAll(".todo-del").forEach((b) =>
        b.addEventListener("click", async () => {
          await table().delete(Number(b.dataset.id));
          render(slot);
        })
      );
      slot.querySelector(".todo-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = slot.querySelector(".todo-input");
        const text = input.value.trim();
        if (!text) return;
        const t2 = table();
        await t2.add({ text, done: 0, createdAt: Date.now() });
        input.value = "";
        render(slot);
      });
    });
  };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  WidgetRegistry.register({
    id: "todo",
    title: "待办",
    icon: "✓",
    zones: ["left"],
    render,
    refresh: render,
  });
})();
