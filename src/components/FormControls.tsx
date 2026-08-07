"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
  pendingLabel = "Enregistrement…",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn btn--${variant}`}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ConfirmDeleteButton({
  action,
  id,
  label = "Supprimer",
  confirmMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="danger" pendingLabel="Suppression…">
        {label}
      </SubmitButton>
    </form>
  );
}

export function ConfirmActionButton({
  action,
  id,
  label,
  confirmMessage,
  variant = "ghost",
  pendingLabel = "…",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  confirmMessage: string;
  variant?: "primary" | "ghost" | "danger";
  pendingLabel?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant={variant} pendingLabel={pendingLabel}>
        {label}
      </SubmitButton>
    </form>
  );
}
