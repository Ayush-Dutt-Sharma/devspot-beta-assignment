
import { FC } from "react";

type ModeCardProps = {
  icon: FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
};

const ModeCard: FC<ModeCardProps> = ({ icon: Icon, title, description, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`card-hover text-left p-6 min-h-[120px] flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-devspot-blue-500/20 rounded-lg">
          <Icon size={20} className="text-devspot-blue-400" />
        </div>
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <p className="text-sm text-devspot-text-secondary leading-relaxed">
        {description}
      </p>
    </button>
  );
};
export default ModeCard;