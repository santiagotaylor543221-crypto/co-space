import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000, "Máximo 2000 caracteres"),
  type: z.enum(["DESK", "MEETING_ROOM", "BOOTH"]),
  capacity: z.number().int("Introduce una capacidad entera").positive("La capacidad debe ser mayor que cero").max(10000, "La capacidad es demasiado alta"),
  pricePerHour: z.number().positive("Introduce una tarifa mayor que cero").max(100000, "La tarifa es demasiado alta"),
  imageUrl: z.string().trim().min(1, "Selecciona una imagen").refine(
    (value) => /^\/(?!\/)[^\s]+$/.test(value) || /^https?:\/\/[^\s]+$/.test(value),
    "Selecciona una imagen o introduce una ruta o URL válida",
  ),
});
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type WorkspaceType = WorkspaceInput["type"];
export type AdminWorkspace = WorkspaceInput & { id: string; isActive: boolean };
export const workspaceLabels: Record<WorkspaceType, string> = { DESK: "Escritorio", MEETING_ROOM: "Sala de reuniones", BOOTH: "Cabina" };
export function workspaceImages(type: WorkspaceType) {
  const prefix = { DESK: "desk", MEETING_ROOM: "meeting-room", BOOTH: "booth" }[type];
  return [1, 2, 3].map((number) => `/images/spaces/${prefix}-${number}.svg`);
}
