import { ImageIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

interface Props {
  label: string;
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** A product's uploaded photo, or the soft coloured placeholder until it has one. */
export function ProductPhoto({ image, name, label, className = 'ph-in', size }: { image?: string; name: string; label: string; className?: string; size?: number }) {
  if (image) return <img className="ph-photo" src={image} alt={name} loading="lazy" decoding="async" />;
  return <PhotoLabel label={label} className={className} size={size} />;
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
