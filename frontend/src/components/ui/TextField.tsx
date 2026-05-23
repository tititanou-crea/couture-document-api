import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
};

export function TextField({ label, help, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="block" htmlFor={fieldId}>
      <span className="label">{label}</span>
      <input id={fieldId} className="field" {...props} />
      {help ? <span className="help-text">{help}</span> : null}
    </label>
  );
}
