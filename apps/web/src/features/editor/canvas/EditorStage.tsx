"use client";

import type Konva from "konva";
import { type RefObject, useEffect, useRef } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { CANVAS_SIZE } from "../model/constants";
import { coverRect } from "../model/geometry";
import type { EditorSnapshot } from "../model/types";
import { StickerNode } from "./StickerNode";
import { TextNode } from "./TextNode";
import { useImageElement } from "./useImageElement";

interface EditorStageProps {
  snapshot: EditorSnapshot;
  viewScale: number;
  stageRef: RefObject<Konva.Stage | null>;
  fontsVersion: number;
  selectedId: string | null;
  guides: { x: boolean; y: boolean };
  showOverlay: boolean;
  onTransformEnd(id: string, node: Konva.Node): void;
}

export function EditorStage(props: EditorStageProps) {
  const { snapshot, viewScale, stageRef } = props;
  const canvas = CANVAS_SIZE[snapshot.ratio];
  const bgImage = useImageElement(
    snapshot.background.type === "image" ? snapshot.background.src : null,
  );
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // PC 선택 핸들: 선택된 블록 노드에 Transformer를 붙인다.
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = props.selectedId ? stage.findOne(`#${CSS.escape(props.selectedId)}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [props.selectedId, snapshot.blocks, stageRef]);

  const strokeWidth = 2 / viewScale;

  return (
    <Stage
      ref={stageRef}
      width={canvas.width * viewScale}
      height={canvas.height * viewScale}
      scaleX={viewScale}
      scaleY={viewScale}
    >
      <Layer listening={false}>
        {snapshot.background.type === "color" ? (
          <Rect width={canvas.width} height={canvas.height} fill={snapshot.background.color} />
        ) : (
          bgImage && (
            <KonvaImage
              image={bgImage}
              {...coverRect({ width: bgImage.naturalWidth, height: bgImage.naturalHeight }, canvas)}
            />
          )
        )}
      </Layer>
      <Layer>
        {snapshot.blocks.map((block) =>
          block.type === "text" ? (
            <TextNode key={block.id} block={block} fontsVersion={props.fontsVersion} />
          ) : (
            <StickerNode key={block.id} block={block} />
          ),
        )}
      </Layer>
      <Layer name="overlay" visible={props.showOverlay}>
        {props.guides.x && (
          <Line
            points={[canvas.width / 2, 0, canvas.width / 2, canvas.height]}
            stroke="#FFD54F"
            strokeWidth={strokeWidth}
            listening={false}
          />
        )}
        {props.guides.y && (
          <Line
            points={[0, canvas.height / 2, canvas.width, canvas.height / 2]}
            stroke="#FFD54F"
            strokeWidth={strokeWidth}
            listening={false}
          />
        )}
        <Transformer
          ref={transformerRef}
          keepRatio
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          rotationSnaps={[0]}
          rotationSnapTolerance={5}
          onTransformEnd={(e) => props.onTransformEnd(e.target.id(), e.target)}
        />
      </Layer>
    </Stage>
  );
}
