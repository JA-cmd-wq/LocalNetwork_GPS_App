import { motion } from 'framer-motion';
import { Route, Download } from 'lucide-react';

interface ToolbarProps {
  showTracks: boolean;
  onToggleTracks: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export default function Toolbar({
  showTracks,
  onToggleTracks,
  onExportJSON, onExportCSV,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <ToolBtn
        icon={<Route size={15} />}
        label="轨迹"
        active={showTracks}
        onClick={onToggleTracks}
      />
      <ToolBtn icon={<Download size={15} />} label="JSON" onClick={onExportJSON} />
      <ToolBtn icon={<Download size={15} />} label="CSV" onClick={onExportCSV} />
    </div>
  );
}

function ToolBtn({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
        ${active
          ? 'bg-white/10 text-white'
          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
