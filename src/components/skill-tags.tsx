import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export function SkillTags({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: readonly string[];
}) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.some((item) => item.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    }
  };
  return (
    <div>
      <div className="tags">
        {value.map((tag) => (
          <span className="tag alert-tag" key={tag}>
            {tag}
            <button type="button" aria-label={`Quitar ${tag}`} onClick={() => onChange(value.filter((item) => item !== tag))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        className="field mt-2"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder="Escribí y presioná Enter"
      />
      <div className="alert-suggest mt-2">
        {suggestions
          .filter((item) => !value.includes(item))
          .map((item) => (
            <button type="button" key={item} onClick={() => add(item)}>
              + {item}
            </button>
          ))}
      </div>
    </div>
  );
}
