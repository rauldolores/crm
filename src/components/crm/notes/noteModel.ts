import {
  Globe,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Icono por tipo de actividad. Solo cubre los valores de fábrica
 * (`defaultNoteTypes` en defaultConfiguration.ts): un tipo personalizado que
 * una organización agregue desde Ajustes cae en el icono genérico, porque no
 * hay forma de guardar un componente de React en la configuración.
 */
const activityTypeIcons: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  note: StickyNote,
  call: Phone,
  meeting: Users,
  whatsapp: MessageCircle,
  email: Mail,
  web: Globe,
};

export const getActivityTypeIcon = (
  type: string | undefined,
): ComponentType<{ className?: string }> =>
  activityTypeIcons[type ?? "note"] ?? StickyNote;

export const validateNoteOrAttachmentRequired = (
  value: string | null | undefined,
  values: { attachments?: unknown[] | null },
) => {
  const hasText = typeof value === "string" && value.trim().length > 0;
  const hasAttachments =
    Array.isArray(values?.attachments) && values.attachments.length > 0;

  return hasText || hasAttachments
    ? undefined
    : "resources.notes.validation.note_or_attachment_required";
};
