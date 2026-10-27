"use client";

type WorkspaceType = "DESK" | "MEETING_ROOM" | "BOOTH";

interface WorkspaceImageProps {
  alt: string;
  className?: string;
  imageUrl?: string;
  type?: WorkspaceType;
}

const imageByType: Record<WorkspaceType, string> = {
  DESK: "/images/desk-1.svg",
  MEETING_ROOM: "/images/meeting-1.svg",
  BOOTH: "/images/booth-1.svg",
};

const legacyImagePaths: Record<string, string> = {
  "/images/desk-1.jpg": imageByType.DESK,
  "/images/meeting-1.jpg": imageByType.MEETING_ROOM,
  "/images/booth-1.jpg": imageByType.BOOTH,
};

export default function WorkspaceImage({
  alt,
  className = "",
  imageUrl,
  type = "DESK",
}: WorkspaceImageProps) {
  const fallbackImage = imageByType[type];
  const src = imageUrl ? legacyImagePaths[imageUrl] ?? imageUrl : fallbackImage;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        if (event.currentTarget.dataset.fallbackApplied !== "true") {
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = fallbackImage;
        }
      }}
    />
  );
}
