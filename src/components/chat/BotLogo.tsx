import { Bot } from 'lucide-react';

const BotAvatar = ({ size = "default" }) => {
  const avatarSizes: Record<string, string> = {
    small: "w-8 h-8",
    default: "w-10 h-10",
    large: "w-12 h-12"
  };

  return (
    <div className={`${avatarSizes[size]} bg-devspot-blue-500 rounded-full flex items-center justify-center flex-shrink-0`}>
      <Bot size={size === "small" ? 16 : size === "large" ? 24 : 20} className="text-white" />
    </div>
  );
};
export default BotAvatar;