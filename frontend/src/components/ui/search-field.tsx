import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
  buttonLabel?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function SearchField({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className,
  buttonLabel = "Search",
  inputClassName,
  buttonClassName,
}: SearchFieldProps) {
  return (
    <Field orientation="horizontal" className={className}>
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
      <Button type="button" onClick={onSearch} className={cn(buttonClassName)}>
        {buttonLabel}
      </Button>
    </Field>
  );
}
