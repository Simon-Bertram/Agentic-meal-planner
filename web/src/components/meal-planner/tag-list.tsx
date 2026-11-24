import type { JSX } from "preact";
import { useCallback, useState } from "preact/hooks";

interface TagListProps {
  disabled?: boolean;
  hint?: string;
  label: string;
  maxLength: number;
  maxTags: number;
  onChange: (tags: string[]) => void;
  placeholder: string;
  tags: string[];
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function TagList({
  label,
  hint,
  tags,
  maxTags,
  maxLength,
  placeholder,
  onChange,
  disabled = false,
}: TagListProps) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputId = `${label}-input`;

  const handleAdd = useCallback(() => {
    const next = normalizeTag(draft);
    if (!next) {
      setLocalError(null);
      return;
    }
    if (next.length > maxLength) {
      setLocalError(`Keep each item under ${maxLength} characters.`);
      return;
    }
    if (tags.includes(next)) {
      setLocalError("Already on the list.");
      return;
    }
    if (tags.length >= maxTags) {
      setLocalError(`Limit is ${maxTags} items.`);
      return;
    }
    onChange([...tags, next]);
    setDraft("");
    setLocalError(null);
  }, [draft, maxLength, maxTags, onChange, tags]);

  const handleKeyDown = useCallback(
    (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  const handleDraftInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      setDraft(event.currentTarget.value);
    },
    []
  );

  const handleRemoveClick = useCallback(
    (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      const { tag } = event.currentTarget.dataset;
      if (!tag) {
        return;
      }
      onChange(tags.filter((item) => item !== tag));
      setLocalError(null);
    },
    [onChange, tags]
  );

  return (
    <div class="space-y-3">
      <div class="flex items-baseline justify-between gap-3">
        <label
          class="text-ink text-sm font-semibold tracking-wide"
          for={inputId}
        >
          {label}
        </label>
        <span class="text-ink-soft text-xs">
          {tags.length}/{maxTags}
        </span>
      </div>
      {hint ? <p class="text-ink-soft text-sm">{hint}</p> : null}
      <ul class="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <button
              class="group border-line bg-surface text-ink hover:border-leaf inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition hover:bg-white disabled:opacity-50"
              data-tag={tag}
              disabled={disabled}
              onClick={handleRemoveClick}
              type="button"
            >
              <span>{tag}</span>
              <span
                aria-hidden="true"
                class="text-ink-soft group-hover:text-leaf-deep"
              >
                ×
              </span>
              <span class="sr-only">Remove {tag}</span>
            </button>
          </li>
        ))}
      </ul>
      <div class="flex gap-2">
        <input
          autocomplete="off"
          class="border-line text-ink focus:border-leaf focus:ring-leaf/20 min-w-0 flex-1 rounded-md border bg-white/80 px-3 py-2 text-sm transition outline-none focus:ring-2 disabled:opacity-50"
          disabled={disabled || tags.length >= maxTags}
          id={inputId}
          onInput={handleDraftInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="text"
          value={draft}
        />
        <button
          class="border-leaf bg-leaf hover:bg-leaf-deep rounded-md border px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || tags.length >= maxTags}
          onClick={handleAdd}
          type="button"
        >
          Add
        </button>
      </div>
      {localError ? (
        <p class="text-danger text-sm" role="status">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
