export type ClipboardImageResult =
  { ok: true; blob: Blob } | { ok: false; reason: "unsupported" | "denied" | "empty" };

const defaultClipboard = () => (typeof navigator === "undefined" ? undefined : navigator.clipboard);

/** [붙여넣기] 버튼용. iOS는 "붙여넣기" 말풍선을 한 번 띄운다. */
export async function readClipboardImage(
  clipboard: Pick<Clipboard, "read"> | undefined = defaultClipboard(),
): Promise<ClipboardImageResult> {
  if (!clipboard || typeof clipboard.read !== "function")
    return { ok: false, reason: "unsupported" };

  let items: ClipboardItems;
  try {
    items = await clipboard.read();
  } catch {
    return { ok: false, reason: "denied" };
  }

  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (type) return { ok: true, blob: await item.getType(type) };
  }
  return { ok: false, reason: "empty" };
}

/** PC Ctrl/Cmd+V용 */
export function imageFromPasteEvent(event: Pick<ClipboardEvent, "clipboardData">): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
  }
  return null;
}
