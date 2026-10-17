import { ImageIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

interface Props {
  label: string;
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Soft coloured block with a label, standing in for a product photo until real photos arrive. */
export function PhotoLabel({ label, color = '#5E4A52', size = 30, className = 'ph-in', style }: Props) {
  return (
    <div className={className} style={{ color, ...style }}>
      <ImageIcon aria-hidden="true" size={size} strokeWidth={1.6} />
      {label}
    </div>
  );
}
