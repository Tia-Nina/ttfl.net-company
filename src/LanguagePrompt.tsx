import { useEffect, useRef } from "react";
import { ArrowRight, Check, Globe2, X } from "lucide-react";
import { content, languageNames, type Language } from "./content";

export default function LanguagePrompt({
  language,
  recommended,
  onChange,
  onConfirm,
  onDismiss,
}: {
  language: Language;
  recommended: Language | null;
  onChange: (language: Language) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = content[language];

  useEffect(() => {
    if (!dialog.current!.open) dialog.current!.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="language-dialog"
      aria-labelledby="language-prompt-title"
      aria-describedby="language-prompt-description"
      onClose={onDismiss}
    >
      <div className="language-dialog-topline">
        <Globe2 size={22} aria-hidden="true" />
        <span lang="en">LANGUAGE</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t.dismissLanguage}
          onClick={onDismiss}
        >
          <X size={19} />
        </button>
      </div>
      <h2 id="language-prompt-title">{t.confirmLanguage}</h2>
      <p id="language-prompt-description">
        {recommended ? t.regionLanguage : t.browserLanguage}
      </p>
      <div
        className="language-options"
        role="radiogroup"
        aria-label={t.language}
      >
        {(Object.entries(languageNames) as [Language, string][]).map(
          ([value, label]) => (
            <label
              key={value}
              className={`language-option ${value === language ? "is-selected" : ""}`}
              lang={value}
            >
              <input
                type="radio"
                name="first-visit-language"
                value={value}
                checked={value === language}
                onChange={() => onChange(value)}
              />
              <span>{label}</span>
              {value === recommended && (
                <span className="language-recommended">
                  {content[value].recommendedLanguage}
                </span>
              )}
              <span className="language-option-check" aria-hidden="true">
                {value === language && <Check size={15} />}
              </span>
            </label>
          ),
        )}
      </div>
      <button type="button" className="language-confirm" onClick={onConfirm}>
        {t.continueLanguage}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </dialog>
  );
}
