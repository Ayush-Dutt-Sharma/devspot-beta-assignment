import BotAvatar from "./BotLogo";

type MessageBubbleProps = {
  message: string;
  sender: 'bot' | 'user';
  children?: React.ReactNode;
};

const MessageBubble = ({ message, sender, children }: MessageBubbleProps) => {
  const isBot = sender === 'bot';
  
  return (
    <div className={`flex gap-3 ${!isBot ? 'justify-end' : ''} animate-fade-in`}>
      {isBot && <BotAvatar />}
      
      <div className={`max-w-2xl ${!isBot ? 'order-first' : ''}`}>
        <div className={isBot ? 'message-bot' : 'message-user'}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;