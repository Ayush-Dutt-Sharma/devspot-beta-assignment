import React from 'react';
import { MessageSquare, Calendar, Users } from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
  userRole?: 'platform_owner' | 'technology_owner' | 'participant';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem = "Chat with Spot", 
  userRole = "technology_owner" 
}) => {
  const getSidebarItems = (role: string) => {
    const baseItems = [
      { icon: MessageSquare, label: 'Chat with Spot', href: '/chat' },
      { icon: Calendar, label: 'Hackathons', href: '/hackathons' },
    ];

    if (role === 'platform_owner') {
      return [...baseItems, 
        { icon: Users, label: "User Management", href: "/admin/users" },
        { icon: Calendar, label: "Platform Settings", href: "/admin/settings" }
      ];
    }

    return baseItems;
  };

  const items = getSidebarItems(userRole);

  return (
    <aside className="devspot-sidebar">
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index}>
              <a 
                href={item.href}
                className={`nav-item ${item.label === activeItem ? 'nav-item-active' : ''}`}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;