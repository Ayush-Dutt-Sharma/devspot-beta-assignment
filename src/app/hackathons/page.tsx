'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Calendar, MapPin, Users, Building2, Globe, Monitor, Map } from 'lucide-react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  title: string;
  organization: string;
  status: string;
  format: string;
  target_audience: string;
  event_size: number;
  total_budget: number;
  budget_currency: string;
  registration_date: string;
  hacking_start: string;
  submission_deadline: string;
  challenges_count: number;
  logo: string | null;
  banner: string | null;
  created_at: string;
  updated_at: string;
}

interface HackathonsResponse {
  hackathons: Hackathon[];
  count: number;
}

const HackathonCard = ({ hackathon }: { hackathon: Hackathon }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format?.toLowerCase()) {
      case 'virtual':
        return <Monitor className="w-4 h-4" />;
      case 'in_person':
        return <Map className="w-4 h-4" />;
      case 'hybrid':
        return <Globe className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getRoutePrefix = (status: string) => {
    return status.toLowerCase() === 'draft' ? '/draft' : '/hackathons';
  };

  return (
    <Link href={`${getRoutePrefix(hackathon.status)}/${hackathon.id}`}>
      <div className="bg-devspot-dark-light border border-gray-700 rounded-lg p-6 hover:border-devspot-blue-500 transition-colors cursor-pointer">
        {/* Header with logo and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {hackathon.logo ? (
              <img 
                src={hackathon.logo} 
                alt={`${hackathon.organization} logo`}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-devspot-dark rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-devspot-text-secondary" />
              </div>
            )}
            <div>
              <p className="text-devspot-text-secondary text-sm font-medium">ORGANIZER</p>
              <p className="text-white text-sm font-semibold">
                {hackathon.organization || 'Unknown Organization'}
              </p>
            </div>
          </div>
          
          <span className={`px-3 py-1 rounded-full border text-xs font-medium uppercase ${getStatusColor(hackathon.status)}`}>
            {hackathon.status}
          </span>
        </div>

        <h3 className="text-white text-lg font-semibold mb-4 line-clamp-2">
          {hackathon.title}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-devspot-text-secondary text-sm">
            {getFormatIcon(hackathon.format)}
            <span className="capitalize">
              {hackathon.format?.replace('_', ' ') || 'Format not specified'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-devspot-text-secondary text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {hackathon.hacking_start ? formatDate(hackathon.hacking_start) : 'Date not set'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-devspot-text-secondary text-sm">
            <Users className="w-4 h-4" />
            <span>{hackathon.event_size || 0} Participants</span>
          </div>
        </div>

        {/* Footer with challenges and budget */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-devspot-text-secondary">
            {hackathon.challenges_count || 0} Challenge{hackathon.challenges_count !== 1 ? 's' : ''}
          </div>
          {hackathon.total_budget > 0 && (
            <div className="text-xs text-green-400 font-medium">
              ${hackathon.total_budget.toLocaleString()} {hackathon.budget_currency || 'USD'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

const HackathonsPage = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hackathons');
      
      if (!response.ok) {
        throw new Error('Failed to fetch hackathons');
      }

      const data: HackathonsResponse = await response.json();
      setHackathons(data.hackathons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-devspot-dark text-white flex flex-col">
      <Header onSearch={(query) => console.log('Search:', query)} />
      
      <div className="flex-1 flex">
        <Sidebar activeItem="Hackathons" />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Hackathons</h1>
            <p className="text-devspot-text-secondary">
              {loading ? 'Loading...' : `${hackathons.length} hackathon${hackathons.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">Error: {error}</p>
              <button 
                onClick={fetchHackathons}
                className="mt-2 text-red-400 hover:text-red-300 underline text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-devspot-dark-light border border-gray-700 rounded-lg p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-devspot-dark rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-devspot-dark rounded mb-1"></div>
                      <div className="h-4 bg-devspot-dark rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-devspot-dark rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-devspot-dark rounded"></div>
                    <div className="h-4 bg-devspot-dark rounded"></div>
                    <div className="h-4 bg-devspot-dark rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <>
              {hackathons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hackathons.map((hackathon) => (
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-devspot-dark-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-devspot-text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No hackathons yet</h3>
                  <p className="text-devspot-text-secondary mb-6">
                    Create your first hackathon to get started
                  </p>
                  <Link 
                    href="/chat"
                    className="inline-flex items-center px-4 py-2 bg-devspot-blue-500 hover:bg-devspot-blue-600 text-white rounded-lg transition-colors"
                  >
                    Create Hackathon
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HackathonsPage;