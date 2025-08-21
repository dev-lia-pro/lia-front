
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  type: 'input' | 'select' | 'textarea';
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  selectProps?: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
  };
}

export const FormField = ({ id, label, required, error, type, inputProps, textareaProps, selectProps }: FormFieldProps) => {
  // Design system unifié avec le thème LIA (navy et gold)
  const baseClassName = "h-12 rounded-lg border-border bg-navy-muted text-foreground placeholder-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-smooth";
  const textareaBaseClassName = "min-h-[80px] rounded-lg border-border bg-navy-muted text-foreground placeholder-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-smooth";
  const errorClassName = error ? 'border-destructive focus:border-destructive focus:ring-destructive' : '';
  const fullClassName = `${baseClassName} ${errorClassName}`;
  const textareaFullClassName = `${textareaBaseClassName} ${errorClassName}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {type === 'input' ? (
        <Input
          id={id}
          {...inputProps}
          className={fullClassName}
        />
      ) : type === 'textarea' ? (
        <Textarea
          id={id}
          {...textareaProps}
          className={textareaFullClassName}
        />
      ) : (
        <Select
          value={selectProps?.value}
          onValueChange={selectProps?.onValueChange}
        >
          <SelectTrigger className={fullClassName}>
            <SelectValue placeholder={selectProps?.placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-navy-card border-border text-foreground">
            {selectProps?.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="hover:bg-navy-muted focus:bg-navy-muted">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
};
