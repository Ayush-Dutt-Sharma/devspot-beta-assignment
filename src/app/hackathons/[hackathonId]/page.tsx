"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Calendar, DollarSign, Users, Building2, Trophy, Clock, ExternalLink, BookOpen, Zap } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  sponsors: string[];
  resources: string[];
  created_at: string;
  order_index: number;
  hackathon_id: string;
  prize_amount: number;
  judging_criteria: string[];
}

interface HackathonData {
  id: string;
  title: string;
  organization: string;
  ispaid: boolean;
  challenges_count: number;
  total_budget: number;
  format: string;
  hacking_start: string;
  registration_date: string;
  submission_deadline: string;
  banner: string | null;
  logo: string | null;
  challenges: Challenge[];
}

const HackathonDetailsPage = () => {
  const params = useParams();
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const response = await fetch(`/api/hackathons/${params.hackathonId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hackathon data');
        }
        const data = await response.json();
        setHackathon(data.hackathon);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.hackathonId) {
      fetchHackathon();
    }
  }, [params.hackathonId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAllSponsors = () => {
    if (!hackathon?.challenges) return [];
    const allSponsors = hackathon.challenges.flatMap(challenge => challenge.sponsors || []);
    return [...new Set(allSponsors)];
  };

  const getAllResources = () => {
    if (!hackathon?.challenges) return [];
    const allResources = hackathon.challenges.flatMap(challenge => challenge.resources || []);
    return [...new Set(allResources)];
  };

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex flex-col">
        <Header onSearch={(query) => console.log("Search:", query)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="h-screen bg-black text-white flex flex-col">
        <Header onSearch={(query) => console.log("Search:", query)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-light mb-2">Error Loading Hackathon</h2>
            <p className="text-white/60 font-light">{error || 'Hackathon not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const allSponsors = getAllSponsors();
  const allResources = getAllResources();

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <Header onSearch={(query) => console.log("Search:", query)} />
      
      <div className="flex-1 flex">
        <Sidebar activeItem="Hackathons" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="relative h-48 overflow-hidden">
            {hackathon.banner ? (
              <img 
                src={hackathon.banner} 
                alt="Hackathon banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-end gap-6">
                {hackathon.logo ? (
                  <img 
                    src={hackathon.logo} 
                    alt="Organization logo" 
                    className="w-20 h-20 rounded-2xl object-cover border border-white/20 backdrop-blur-xl bg-black/50"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <Zap className="w-10 h-10 text-white/60" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-4xl font-light text-white mb-2">
                    {hackathon.title || 'Untitled Hackathon'}
                  </h1>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {hackathon.organization || 'No organization'}
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                      {hackathon.format?.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                      {formatCurrency(hackathon.total_budget)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50"></div>
              <div className="relative">
                <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Registration</span>
                    </div>
                    <p className="text-white font-light">{formatDate(hackathon.registration_date)}</p>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Start</span>
                    </div>
                    <p className="text-white font-light">{formatDate(hackathon.hacking_start)}</p>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Deadline</span>
                    </div>
                    <p className="text-white font-light">{formatDate(hackathon.submission_deadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Challenges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hackathon.challenges && hackathon.challenges.length > 0 ? 
                  hackathon.challenges
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((challenge) => (
                    <div key={challenge.id} className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <h4 className="font-light text-white text-lg mb-3">{challenge.title}</h4>
                        <div className="text-2xl font-light text-white mb-3">
                          {formatCurrency(challenge.prize_amount)}
                        </div>
                        {challenge.judging_criteria && challenge.judging_criteria.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {challenge.judging_criteria.slice(0, 2).map((criteria, idx) => (
                              <span key={idx} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-full">
                                {criteria}
                              </span>
                            ))}
                            {challenge.judging_criteria.length > 2 && (
                              <span className="text-xs text-white/40">
                                +{challenge.judging_criteria.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                      <Trophy className="w-8 h-8 text-white/40 mx-auto mb-2" />
                      <p className="text-white/60 font-light">No challenges available</p>
                    </div>
                  )
                }
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allSponsors.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Sponsors
                  </h3>
                  <div className="space-y-2">
                    {allSponsors.map((sponsor, index) => (
                      <div key={index} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-light text-sm">{sponsor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allResources.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Resources
                  </h3>
                  <div className="space-y-2">
                    {allResources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-light text-sm">{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonDetailsPage;