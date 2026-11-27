"use client";

import Konva from "konva";
import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import { FONTS } from "../media/fonts";
import { textStyle } from "../model/textStyle";
import type { TextBlock } from "../model/types";

const LINE_HEIGHT = 1.2;

interface MeasureInput {
  text: string;
  fontSize: number;
  align: TextBlock["align"];
  family: string;
  /** 폰트 파일이 새로 로드될 때마다 바뀌는 값. 다시 재기 위한 캐시 키로만 쓴다. */
  fontsVersion: number;
}

function measure({ text, fontSize, align, family }: MeasureInput) {
  const probe = new Konva.Text({
    text,
    fontFamily: family,
    fontSize,
    lineHeight: LINE_HEIGHT,
    align,
  });
  const size = { width: probe.width(), height: probe.height() };
  probe.destroy();
  return size;
}

export function TextNode({ block, fontsVersion }: { block: TextBlock; fontsVersion: number }) {
  const family = FONTS[block.fontId].family;
  const { text, fontSize, align } = block;
  // 폰트 파일이 새로 로드되면(fontsVersion 변경) 글자 폭을 다시 잰다.
  const size = useMemo(
    () => measure({ text, fontSize, align, family, fontsVersion }),
    [text, fontSize, align, family, fontsVersion],
  );
  const style = textStyle(block.color, block.textBg);
  const pad = style.box ? block.fontSize * 0.3 : 0;

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
      {style.box && (
        <Rect
          x={-size.width / 2 - pad}
          y={-size.height / 2 - pad}
          width={size.width + pad * 2}
          height={size.height + pad * 2}
          cornerRadius={block.fontSize * 0.25}
          fill={style.box}
        />
      )}
      <Text
        x={-size.width / 2}
        y={-size.height / 2}
        width={size.width}
        text={block.text}
        fontFamily={family}
        fontSize={block.fontSize}
        lineHeight={LINE_HEIGHT}
        align={block.align}
        fill={style.fill}
      />
    </Group>
  );
}
