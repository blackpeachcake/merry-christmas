"use client";

import { Group, Image as KonvaImage } from "react-konva";
import type { StickerBlock } from "../model/types";
import { useImageElement } from "./useImageElement";

export function StickerNode({ block }: { block: StickerBlock }) {
  const image = useImageElement(block.src);
  return (
    <Group
      id={block.id}
      name="block"
      x={block.x}
      y={block.y}
      rotation={block.rotation}
      scaleX={block.scale}
      scaleY={block.scale}
    >
      {image && (
        <KonvaImage
          image={image}
          x={-block.width / 2}
          y={-block.height / 2}
          width={block.width}
          height={block.height}
        />
      )}
    </Group>
  );
}
