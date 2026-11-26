import type { WorkspaceType } from "@/lib/workspace-schema";

const defaultPhoto: Record<WorkspaceType, string> = {
  DESK: "escritorio-flex-zona-a",
  MEETING_ROOM: "sala-reuniones-creativa",
  BOOTH: "cabina-privada-llamadas",
};

const namedPhotos = new Map([
  ["escritorio flex - zona a", defaultPhoto.DESK],
  ["sala de reuniones creativa", defaultPhoto.MEETING_ROOM],
  ["cabina privada para llamadas", defaultPhoto.BOOTH],
  ["gaming room", "gaming-room"],
  ["sala duo", "sala-duo"],
]);

const defaultImage = /^\/images\/(?:desk-1|meeting-1|booth-1)\.(?:svg|jpg)$|^\/images\/spaces\/(?:desk|meeting-room|booth)-[1-3]\.svg$/;

export function catalogWorkspaceImage(
  name: string,
  type: WorkspaceType = "DESK",
  imageUrl?: string,
) {
  if (imageUrl && !defaultImage.test(imageUrl)) return imageUrl;

  const photo = namedPhotos.get(name.trim().toLowerCase()) ?? defaultPhoto[type];
  return `/images/catalog/${photo}.webp`;
}
