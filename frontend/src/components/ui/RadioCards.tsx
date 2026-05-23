type RadioCardsProps<T extends string> = {
  title: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
};

export function RadioCards<T extends string>({ title, value, options, onChange }: RadioCardsProps<T>) {
  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold transition ${
              value === option.value
                ? "border-rosewood bg-rosewood text-white"
                : "border-rosewood/15 bg-white text-ink hover:bg-cream"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
