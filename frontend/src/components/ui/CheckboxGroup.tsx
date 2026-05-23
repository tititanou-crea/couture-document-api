import type { Option } from "@/utils/bookOptions";

type CheckboxGroupProps<T extends string> = {
  title: string;
  options: Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
};

export function CheckboxGroup<T extends string>({ title, options, values, onChange }: CheckboxGroupProps<T>) {
  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-9 cursor-pointer items-start gap-2 rounded-md border border-transparent bg-white px-2 py-1.5 transition hover:border-rosewood/20 hover:bg-[#fff5f7]"
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="mt-0.5 h-4 w-4 rounded border-rosewood/30 text-rosewood"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              {option.hint ? <span className="mt-1 block text-xs leading-5 text-stone-600">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
