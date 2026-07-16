import React, { useRef, useState } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  /** Any CSS color, including var() references — it lands in a CSS custom property. */
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)'
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  const handleClick: React.MouseEventHandler<HTMLDivElement> = () => {
    setFlipped(prev => !prev);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className={`card-spotlight ${flipped ? 'is-flipped' : ''} ${className}`}
    >
      <div className="card-spotlight-inner">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
