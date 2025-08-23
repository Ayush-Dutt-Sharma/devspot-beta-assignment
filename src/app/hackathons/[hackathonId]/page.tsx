"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Calendar, MapPin, DollarSign, Users, Globe, Building2, Trophy, Clock, Award, ExternalLink, BookOpen, Star, Zap, Code, Layers } from 'lucide-react';

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
  logo_url: string | null;
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

  // Combine all sponsors and resources from challenges
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
            <h2 className="text-xl font-bold mb-2">Error Loading Hackathon</h2>
            <p className="text-white/60">{error || 'Hackathon not found'}</p>
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
          <div className="p-6">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0">
                  {hackathon.logo_url ? (
                    <img 
                      src={hackathon.logo_url} 
                      alt="Organization logo" 
                      className="w-16 h-16 rounded-xl object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                      <Zap className="w-8 h-8 text-white/60" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {hackathon.title || 'Untitled Hackathon'}
                    </h1>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                      {formatCurrency(hackathon.total_budget)}
                    </span>
                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium border border-purple-500/30">
                      {hackathon.challenges?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-white/70">
                    <Building2 className="w-4 h-4" />
                    <span>{hackathon.organization || 'No organization specified'}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-white/10 px-2 py-1 rounded">{hackathon.format?.toUpperCase()}</span>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded">{hackathon.ispaid ? 'PAID' : 'FREE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              
              <div className="col-span-12 lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {hackathon.challenges && hackathon.challenges.length > 0 ? 
                    hackathon.challenges
                      .sort((a, b) => a.order_index - b.order_index)
                      .slice(0, 6)
                      .map((challenge, index) => (
                      <div key={challenge.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-white text-lg leading-tight">{challenge.title}</h3>
                          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-green-400 font-bold text-xl">
                            {formatCurrency(challenge.prize_amount)}
                          </div>
                          {challenge.judging_criteria && challenge.judging_criteria.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {challenge.judging_criteria.slice(0, 3).map((criteria, criteriaIndex) => (
                                <span 
                                  key={criteriaIndex}
                                  className="bg-white/10 text-white/70 px-2 py-1 rounded text-xs"
                                >
                                  {criteria}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 text-center">
                        <Trophy className="w-8 h-8 text-white/40 mx-auto mb-2" />
                        <p className="text-white/60">No challenges available</p>
                      </div>
                    )
                  }
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Timeline</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: 'Registration', date: hackathon.registration_date, icon: Users, color: 'blue' },
                      { title: 'Start', date: hackathon.hacking_start, icon: Clock, color: 'green' },
                      { title: 'Deadline', date: hackathon.submission_deadline, icon: Trophy, color: 'red' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className={`w-2 h-2 bg-${event.color}-500 rounded-full`}></div>
                        <event.icon className="w-4 h-4 text-white/60" />
                        <span className="text-white/80 text-sm font-medium">{event.title}</span>
                        <span className="text-white/60 text-sm ml-auto">{formatDate(event.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-4">
                
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold text-white">Prizes</h3>
                  </div>
                  {hackathon.challenges && hackathon.challenges.length > 0 ? (
                    <div className="space-y-2">
                      {hackathon.challenges
                        .sort((a, b) => b.prize_amount - a.prize_amount)
                        .slice(0, 3)
                        .map((challenge, index) => (
                        <div key={challenge.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              index === 0 ? 'bg-yellow-400' : 
                              index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                            }`}></div>
                            <span className="text-white/80 text-sm font-medium">{index + 1}st Place</span>
                          </div>
                          <span className="text-green-400 font-bold text-sm">
                            {formatCurrency(challenge.prize_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No prize information available</p>
                  )}
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Technologies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'Python', 'AI/ML', 'Blockchain', 'Mobile'].map((tech) => (
                      <span key={tech} className="bg-white/10 text-white/80 px-2 py-1 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {allSponsors.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">Sponsors</h3>
                    </div>
                    <div className="space-y-2">
                      {allSponsors.slice(0, 4).map((sponsor, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                          <ExternalLink className="w-3 h-3 text-white/60" />
                          <span className="text-white/80 text-sm">{sponsor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allResources.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white">Resources</h3>
                    </div>
                    <div className="space-y-2">
                      {allResources.slice(0, 4).map((resource, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                          <ExternalLink className="w-3 h-3 text-white/60" />
                          <span className="text-white/80 text-sm">{resource}</span>
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
    </div>
  );
};

export default HackathonDetailsPage;