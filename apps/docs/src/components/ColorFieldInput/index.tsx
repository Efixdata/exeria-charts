import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import styles from "./colorFieldInput.module.css";

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return trimmed;
};

const toColorInputValue = (value: string) => {
  const normalized = normalizeHexColor(value);
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : "#000000";
};

export interface ColorFieldInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  swatchClassName?: string | undefined;
  hexClassName?: string | undefined;
  swatchStyle?: CSSProperties | undefined;
  hexStyle?: CSSProperties | undefined;
  swatchAriaLabel: string;
  hexAriaLabel?: string | undefined;
  maxLength?: number | undefined;
  uppercaseOnPick?: boolean | undefined;
}

export function ColorFieldInput({
  value,
  onChange,
  className,
  style,
  swatchClassName,
  hexClassName,
  swatchStyle,
  hexStyle,
  swatchAriaLabel,
  hexAriaLabel,
  maxLength = 10,
  uppercaseOnPick = true,
}: ColorFieldInputProps) {
  const color = normalizeHexColor(value);
  const colorInputValue = toColorInputValue(value);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const isPickerOpenRef = useRef(false);

  useEffect(() => {
    const dismissPicker = (event: Event) => {
      const colorInput = colorInputRef.current;
      if (!colorInput) {
        return;
      }

      const target = event.target as Node;
      if (swatchRef.current?.contains(target)) {
        return;
      }

      if (!isPickerOpenRef.current && document.activeElement !== colorInput) {
        return;
      }

      colorInput.blur();
      isPickerOpenRef.current = false;
    };

    document.addEventListener("mousedown", dismissPicker, true);
    document.addEventListener("touchstart", dismissPicker, true);

    return () => {
      document.removeEventListener("mousedown", dismissPicker, true);
      document.removeEventListener("touchstart", dismissPicker, true);
    };
  }, []);

  const openPicker = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    isPickerOpenRef.current = true;
    colorInputRef.current?.click();
  };

  const handleColorPick = (nextValue: string) => {
    onChange(uppercaseOnPick ? nextValue.toUpperCase() : nextValue);
  };

  return (
    <div className={className} style={style}>
      <span className={styles.swatchWrap}>
        <input
          ref={colorInputRef}
          type="color"
          className={styles.hiddenColorInput}
          value={colorInputValue}
          tabIndex={-1}
          aria-hidden
          onFocus={() => {
            isPickerOpenRef.current = true;
          }}
          onBlur={() => {
            isPickerOpenRef.current = false;
          }}
          onChange={(event) => handleColorPick(event.target.value)}
        />
        <button
          ref={swatchRef}
          type="button"
          className={[swatchClassName, styles.swatchButton].filter(Boolean).join(" ")}
          style={{ ...swatchStyle, backgroundColor: colorInputValue }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={openPicker}
          aria-label={swatchAriaLabel}
        />
      </span>
      <input
        type="text"
        className={hexClassName}
        style={hexStyle}
        value={color}
        maxLength={maxLength}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        aria-label={hexAriaLabel ?? `${swatchAriaLabel} hex value`}
      />
    </div>
  );
}
