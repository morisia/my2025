
'use client';

import { useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Removed FormItem, FormLabel, FormControl, FormDescription, FormMessage imports from '@/components/ui/form'
import type { ControllerRenderProps } from 'react-hook-form';
import type { AiStylistFormValues } from './ai-stylist-form'; // Keep this if AiStylistFormValues is needed for field typing

interface SelectWithOptionalTextareaProps {
  field: ControllerRenderProps<AiStylistFormValues, keyof AiStylistFormValues>; // field from RHF
  options: string[];
  selectPlaceholder: string;
  textareaPlaceholder: string;
}

export function SelectWithOptionalTextarea({
  field,
  options,
  selectPlaceholder,
  textareaPlaceholder,
}: SelectWithOptionalTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if a predefined option is selected or if it's 'Other' (or custom text)
  const isPredefinedOptionSelected = field.value && options.includes(field.value);
  // displaySelectValue controls what the <Select> UI component itself shows as selected.
  // If RHF's field.value is one of the predefined options, show that. Otherwise, show "Other".
  const displaySelectValue = isPredefinedOptionSelected ? field.value : 'Other';
  // showTextarea is true if "Other" is selected in the UI (or if the value is custom)
  const showTextarea = displaySelectValue === 'Other';

  useEffect(() => {
    // Focus textarea if "Other" is selected and the actual RHF value is empty
    // (meaning user selected "Other" but hasn't typed anything yet)
    if (showTextarea && field.value === '' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showTextarea, field.value]);

  return (
    <div className="space-y-2">
      <Select
        onValueChange={(value) => {
          if (value === 'Other') {
            // When "Other" is chosen in Select, set RHF's actual value to empty string
            // to prepare for custom text input in Textarea.
            field.onChange('');
          } else {
            // When a predefined option is chosen, set RHF's value to that option.
            field.onChange(value);
          }
        }}
        value={displaySelectValue} // This value controls the Select's displayed option
        name={field.name} // Pass name from RHF field for accessibility
      >
        <SelectTrigger id={`${field.name}-select-trigger`}>
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value="Other">სხვა (მიუთითეთ ქვემოთ)</SelectItem>
        </SelectContent>
      </Select>

      {showTextarea && (
        <Textarea
          ref={textareaRef}
          id={`${field.name}-other-input`} // Unique ID for the textarea
          name={field.name} // Textarea gets the same name as it's part of the same RHF field
          placeholder={textareaPlaceholder}
          onChange={(e) => field.onChange(e.target.value)} // Update RHF value directly from textarea
          // Textarea value should be RHF's field.value.
          // If field.value was a predefined option, and user switched to "Other",
          // field.onChange('') would have cleared it. So field.value is the custom text.
          value={field.value || ''}
          className="mt-2" // Removed h-12, relies on default min-h from ui/textarea
        />
      )}
    </div>
  );
}
