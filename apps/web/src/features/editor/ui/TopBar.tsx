"use client";

interface TopBarProps {
  hidden: boolean;
  canUndo: boolean;
  canRedo: boolean;
  exporting: boolean;
  onClose(): void;
  onUndo(): void;
  onRedo(): void;
  onBackground(): void;
  onText(): void;
  onSticker(): void;
  onExport(): void;
}

const iconButton =
  "flex size-10 items-center justify-center rounded-full bg-black/40 text-lg disabled:opacity-30";

export function TopBar(props: TopBarProps) {
  if (props.hidden) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex gap-2">
        <button aria-label="새로 만들기" className={iconButton} onClick={props.onClose}>
          ✕
        </button>
        <button
          aria-label="실행 취소"
          className={iconButton}
          disabled={!props.canUndo}
          onClick={props.onUndo}
        >
          ↶
        </button>
        <button
          aria-label="다시 실행"
          className={iconButton}
          disabled={!props.canRedo}
          onClick={props.onRedo}
        >
          ↷
        </button>
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button aria-label="배경" className={iconButton} onClick={props.onBackground}>
          🎨
        </button>
        <button aria-label="텍스트 추가" className={iconButton} onClick={props.onText}>
          Aa
        </button>
        <button aria-label="스티커 추가" className={iconButton} onClick={props.onSticker}>
          🖼
        </button>
        <button
          aria-label="이미지 저장"
          className={iconButton}
          disabled={props.exporting}
          onClick={props.onExport}
        >
          ⬇
        </button>
      </div>
    </div>
  );
}
