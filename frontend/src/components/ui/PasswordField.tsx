import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  help?: string;
};

export function PasswordField({ label, help, id, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? props.name ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="label">{label}</span>
      <span className="relative block">
        <input
          id={fieldId}
          className="field pr-14"
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-rosewood transition hover:bg-[#fff2f5]"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff aria-hidden size={19} /> : <Eye aria-hidden size={19} />}
        </button>
      </span>
      {help ? <span className="help-text">{help}</span> : null}
    </label>
  );
}
