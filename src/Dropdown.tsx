import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

type Option<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
  lang?: string;
};

export default function Dropdown<Value extends string>({
  label,
  value,
  options,
  icon,
  className = "",
  onChange,
}: {
  label: string;
  value: Value;
  options: Option<Value>[];
  icon: ReactNode;
  className?: string;
  onChange: (value: Value) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((option) => option.value === value)!;

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      ?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menu.current!.querySelectorAll<HTMLButtonElement>("button"),
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex: number;
    switch (event.key) {
      case "ArrowDown":
        nextIndex = (index + 1) % items.length;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = items.length - 1;
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
        return;
      case "Tab":
        setOpen(false);
        trigger.current?.focus();
        return;
      default:
        return;
    }
    event.preventDefault();
    items[nextIndex].focus();
  }

  return (
    <div
      ref={container}
      className={`dropdown ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="dropdown-trigger"
        aria-label={`${label} — ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {icon}
        <span className="dropdown-label">{selected.label}</span>
        <ChevronDown
          className="dropdown-chevron"
          size={12}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          className="dropdown-menu"
          onKeyDown={handleMenuKey}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={value === option.value}
              lang={option.lang}
              tabIndex={-1}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              {option.icon}
              <span>{option.label}</span>
              {value === option.value && (
                <Check
                  className="dropdown-check"
                  size={15}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
