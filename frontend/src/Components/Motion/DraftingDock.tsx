import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  isActive?: boolean;
  onClick?: () => void;
  mouseX: MotionValue<number>;
}

const DockItem: React.FC<DockItemProps> = ({
  icon,
  label,
  sublabel,
  isActive = false,
  onClick,
  mouseX,
}) => {
  const itemRef = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = itemRef.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [48, 68, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 14 });

  return (
    <motion.button
      ref={itemRef}
      style={{ width, height: width }}
      onClick={onClick}
      className={`group relative flex items-center justify-center rounded-xl border transition-colors select-none shrink-0 ${
        isActive
          ? "bg-(--accent-primary) text-white border-(--accent-primary) shadow-lg shadow-(--accent-glow)"
          : "bg-(--bg-surface) text-(--text-secondary) border-(--border-strong) hover:text-(--text-primary) hover:border-(--accent-primary)"
      }`}
    >
      <div className="flex items-center justify-center scale-100 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      {/* Floating Tooltip */}
      <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-(--bg-surface-elevated) border border-(--border-strong) text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-30">
        <div className="font-bold text-(--text-primary)">{label}</div>
        <div className="text-[9px] text-(--text-muted)">{sublabel}</div>
      </div>
    </motion.button>
  );
};

export interface DockTool {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

interface DraftingDockProps {
  tools: DockTool[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const DraftingDock: React.FC<DraftingDockProps> = ({
  tools,
  activeId,
  onSelect,
  className = "",
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex items-end gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-(--bg-surface-translucent) backdrop-blur-xl border-2 border-(--border-strong) shadow-2xl max-w-full overflow-x-auto touch-pan-x ${className}`}
    >
      {tools.map((t) => (
        <DockItem
          key={t.id}
          icon={t.icon}
          label={t.label}
          sublabel={t.sublabel}
          isActive={activeId === t.id}
          onClick={() => onSelect(t.id)}
          mouseX={mouseX}
        />
      ))}
    </motion.div>
  );
};
export default DraftingDock;
