import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  user?: { name?: string } | null;
}

const Header: React.FC<HeaderProps> = ({ onSearch, user = null }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="devspot-header">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <a className="flex items-center gap-2" href="https://devspot.app">
            <Image
              src="/assets/images/devspot_logo.webp"
              alt="DevSpot"
              width={128}
              height={32}
              className="cursor-pointer h-auto"
              priority
            />
            <Image
              src="/assets/images/beta.svg"
              alt="Beta"
              width={56}
              height={24}
              className="cursor-pointer h-auto"
            />
          </a>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-devspot-text-muted" size={16} />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder="Search for hackathons, companies, developers, events and discussions"
              className="input-primary w-96 pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-devspot-text-muted hover:text-white transition-colors rounded-lg hover:bg-devspot-gray-700/50">
            <Bell size={18} />
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer hover:bg-devspot-gray-700/50 rounded-lg p-2 transition-colors">
            <div className="w-8 h-8 bg-devspot-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <ChevronDown size={16} className="text-devspot-text-muted" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;