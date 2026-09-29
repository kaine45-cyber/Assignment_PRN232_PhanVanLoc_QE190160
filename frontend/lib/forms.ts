import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, errorMessage } from "./api";

/**
 * Shows server-side validation errors next to the matching form fields (400 with field errors)
 * and a toast with the overall message.
 */
export function handleFormError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: string[]) {
  if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
    for (const [field, message] of Object.entries(err.fieldErrors)) {
      if (fields.includes(field)) setError(field as Path<T>, { type: "server", message });
    }
  }
  toast.error(errorMessage(err));
}
