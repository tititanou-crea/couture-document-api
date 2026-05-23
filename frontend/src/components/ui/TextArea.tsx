import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  help?: string;
};

export function TextArea({ label, help, id, ...props }: TextAreaProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="block" htmlFor={fieldId}>
      <span className="label">{label}</span>
      <textarea id={fieldId} className="field min-h-32 resize-y" {...props} />
      {help ? <span className="help-text">{help}</span> : null}
    </label>
  );
}
