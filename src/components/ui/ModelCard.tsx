import { FC, useState } from "react";

type ModeCardProps = {
  icon: FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
};

const ModeCard: FC<ModeCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  className = "" 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden text-left p-6 min-h-[180px] flex flex-col gap-4 bg-gradient-to-br from-devspot-blue-500/10 to-purple-500/10 border border-devspot-blue-500/20 rounded-2xl hover:border-devspot-blue-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-devspot-blue-500/10 transform-gpu ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-devspot-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      
      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-devspot-blue-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute bottom-6 left-4 w-12 h-12 bg-gradient-to-br from-purple-500/10 to-devspot-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-2">
          <div className={`p-3 bg-gradient-to-br from-devspot-blue-500 to-purple-500 rounded-xl shadow-lg transition-all duration-300 ${
            isHovered ? 'shadow-devspot-blue-500/25 scale-110' : ''
          }`}>
            <Icon 
              size={24} 
              className={`text-white transition-transform duration-300 ${
                isHovered ? 'rotate-12' : ''
              }`} 
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white group-hover:text-devspot-blue-300 transition-colors duration-300">
              {title}
            </h3>
          </div>
        </div>
        <p className="text-sm text-devspot-text-secondary leading-relaxed group-hover:text-gray-300 transition-colors duration-300 mb-4">
          {description}
        </p>
        <div className="flex items-center gap-2 text-devspot-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
          <span className="text-sm font-medium">Get Started</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${
              isHovered ? 'translate-x-1' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full transform-gpu animate-shimmer" 
           style={{
             animation: isHovered ? 'shimmer 2s ease-in-out infinite' : 'none'
           }} 
      />
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
};

export default ModeCard;