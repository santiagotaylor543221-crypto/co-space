"use client";

import Image from "next/image";
import { useState } from "react";

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

const imageVariants: Record<WorkspaceType, string[]> = {
  DESK: [1, 2, 3].map((variant) => `/images/spaces/desk-${variant}.svg`),
  MEETING_ROOM: [1, 2, 3].map(
    (variant) => `/images/spaces/meeting-room-${variant}.svg`,
  ),
  BOOTH: [1, 2, 3].map((variant) => `/images/spaces/booth-${variant}.svg`),
};

const legacyImagePaths: Record<string, string> = {
  "/images/desk-1.jpg": imageByType.DESK,
  "/images/meeting-1.jpg": imageByType.MEETING_ROOM,
  "/images/booth-1.jpg": imageByType.BOOTH,
};

function isWorkspaceType(type: string): type is WorkspaceType {
  return type === "DESK" || type === "MEETING_ROOM" || type === "BOOTH";
}

function getVariantIndex(name: string) {
  // El nombre mantiene la misma variante entre renders.
  return [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
}

export default function WorkspaceImage({
  alt,
  className = "",
  imageUrl,
  type = "DESK",
}: WorkspaceImageProps) {
  const knownType = isWorkspaceType(type) ? type : null;
  const fallbackImage = knownType ? imageByType[knownType] : imageByType.DESK;
  const legacyImage = imageUrl ? legacyImagePaths[imageUrl] : undefined;
  const resolvedImage = legacyImage ?? imageUrl;
  const isGenericImage =
    !resolvedImage || Object.values(imageByType).includes(resolvedImage);
  // Las rutas antiguas y genéricas dan paso a las ilustraciones nuevas.
  const initialImage =
    knownType && isGenericImage
      ? imageVariants[knownType][getVariantIndex(alt)]
      : knownType
        ? resolvedImage
        : fallbackImage;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const src =
    failedImage === initialImage ? fallbackImage : initialImage || fallbackImage;

  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      unoptimized
      className={className}
      onError={() => {
        if (src !== fallbackImage) {
          setFailedImage(src);
        }
      }}
    />
  );
}
