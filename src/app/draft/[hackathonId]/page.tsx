'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PaymentPopup from '@/components/payment/PaymentPopup';
import {
  Calendar, MapPin, DollarSign, Users, Globe, Building2, Trophy,
  Edit3, Save, Plus, Trash2, X, Check, AlertTriangle, CreditCard,
  MessageCircle
} from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { wrapFetchWithPayment } from 'x402-fetch';
import { ethers } from 'ethers';

interface Challenge {
  id: string;
  title: string;
  description: string;
  prize_amount: number;
  judging_criteria: string[];
  sponsors: string[];
  resources: string[];
  created_at: string;
}

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
  challenges: Challenge[];
  logo: string | null;
  banner: string | null;
  conversation_id: string | null;
}

interface HackathonResponse {
  hackathon: Hackathon;
  combinedSponsors: string[];
  combinedResources: string[];
}

const DEFAULT_JUDGING_CRITERIA = [
  'Innovation / Creativity',
  'Technical Execution',
  'User Experience (UX)',
  'Impact / Usefulness',
  'Completeness / Functionality',
  'Presentation / Demo Quality',
  'Scalability / Future Potential',
  'Relevance to Theme / Challenge'
];

const DraftHackathonEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params?.hackathonId as string;

  const [data, setData] = useState<HackathonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingHackathon, setEditingHackathon] = useState(false);
  const [editingChallenges, setEditingChallenges] = useState<string[]>([]);
  const [newChallenge, setNewChallenge] = useState<Partial<Challenge>>({});
  const [showNewChallengeForm, setShowNewChallengeForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const { getToken } = useAuth();

  // Form states
  const [hackathonForm, setHackathonForm] = useState<Partial<Hackathon>>({});
  const [challengeForms, setChallengeForms] = useState<{ [key: string]: Partial<Challenge> }>({});

  // Fetch wallet address from Clerk user
  const walletAddress = user?.web3Wallets[0].web3Wallet as string | undefined;

  const isWalletConnected = !!walletAddress;

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId]);

  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hackathons/${hackathonId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hackathon data');
      }

      const hackathonData: HackathonResponse = await response.json();
      setData(hackathonData);
      setHackathonForm(hackathonData.hackathon);

      const forms: { [key: string]: Partial<Challenge> } = {};
      hackathonData?.hackathon.challenges.forEach((challenge) => {
        forms[challenge.id] = { ...challenge };
      });
      setChallengeForms(forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateHackathon = () => {
    const errors: string[] = [];
    const totalChallengesPrizes = data?.hackathon?.challenges.reduce((sum, challenge) => sum + (challenge.prize_amount || 0), 0) || 0;
    const now = new Date();

    if (hackathonForm.total_budget && hackathonForm.total_budget < 20000) {
      errors.push('Total budget must be at least $20,000 USDC');
    }

    if (hackathonForm.total_budget && hackathonForm.total_budget < totalChallengesPrizes) {
      errors.push(`Total budget ($${hackathonForm.total_budget}) cannot be lower than sum of challenge prizes ($${totalChallengesPrizes})`);
    }

    if (data && data.hackathon.challenges.length < 2) {
      errors.push('Minimum 2 challenges required');
    }

    if (hackathonForm.registration_date) {
      const registrationDate = new Date(hackathonForm.registration_date);
      if (registrationDate < now) {
        errors.push('Registration date must be on or after the current date');
      }
    }

    if (hackathonForm.registration_date && hackathonForm.hacking_start) {
      const registrationDate = new Date(hackathonForm.registration_date);
      const hackingStartDate = new Date(hackathonForm.hacking_start);
      if (hackingStartDate < registrationDate) {
        errors.push('Hacking start date must be on or after the registration date');
      }
    }

    if (hackathonForm.hacking_start && hackathonForm.submission_deadline) {
      const hackingStartDate = new Date(hackathonForm.hacking_start);
      const submissionDeadline = new Date(hackathonForm.submission_deadline);
      if (submissionDeadline <= hackingStartDate) {
        errors.push('Submission deadline must be after the hacking start date');
      }
    }

    data?.hackathon.challenges.forEach((challenge, index) => {
      if (!challenge.judging_criteria || challenge.judging_criteria.length < 4) {
        errors.push(`Challenge ${index + 1} needs at least 4 judging criteria`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const presignedURL = new URL('/api/s3/presigned', window.location.href);
      presignedURL.searchParams.set('fileName', file.name);
      presignedURL.searchParams.set('contentType', file.type);

      const presignedResponse = await fetch(presignedURL.toString());
      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const presignedData = await presignedResponse.json();
      const uploadResponse = await fetch(presignedData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      const imageUrl = presignedData.signedUrl.split('?')[0];

      setHackathonForm((prev) => ({
        ...prev,
        [type]: imageUrl
      }));

      const jsonBody = {
        ...hackathonForm,
        [type]: imageUrl
      };
      delete jsonBody['challenges'];

      const updateResponse = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonBody)
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update hackathon in database');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update image');
    }
  };

  const saveHackathon = async () => {
    if (!validateHackathon()) return;

    try {
      setSaving(true);
      const jsonBody = { ...hackathonForm };
      delete jsonBody['challenges'];
      const response = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hackathon');
      }

      setEditingHackathon(false);
      await fetchHackathon();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hackathon');
    } finally {
      setSaving(false);
    }
  };

  const saveChallenge = async (challengeId: string) => {
    const challengeData = challengeForms[challengeId];

    if (!challengeData.judging_criteria || challengeData.judging_criteria.length < 4) {
      setError('Challenge must have at least 4 judging criteria');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update challenge');
      }

      setEditingChallenges((prev) => prev.filter((id) => id !== challengeId));
      await fetchHackathon();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save challenge');
    } finally {
      setSaving(false);
    }
  };

  const createChallenge = async () => {
    if (!newChallenge.judging_criteria || newChallenge.judging_criteria.length < 4) {
      setError('Challenge must have at least 4 judging criteria');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newChallenge,
          hackathon_id: hackathonId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }

      setShowNewChallengeForm(false);
      setNewChallenge({});
      await fetchHackathon();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
    } finally {
      setSaving(false);
    }
  };

  const deleteChallenge = async (challengeId: string) => {
    if (data && data.hackathon.challenges.length <= 2) {
      setError('Cannot delete challenge. Minimum 2 challenges required.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete challenge');
      }

      setShowDeleteConfirm(null);
      await fetchHackathon();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete challenge');
    } finally {
      setSaving(false);
    }
  };

  const publishHackathon = async () => {
    if (!validateHackathon()) {
      setError('Please fix all validation errors before publishing');
      return;
    }

    if (!isWalletConnected) {
      setError('Please connect your Web3 wallet to publish');
      return;
    }

    setShowPaymentPopup(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentPopup(false);
    router.push(`/hackathons/${hackathonId}`);
  };

  const handlePayment = async () => {
    if (!walletAddress) {
      setError('No wallet address found');
      return;
    }

    try {
      setSaving(true);
        //@ts-ignore
      if (!window.ethereum) {
      throw new Error('No Web3 provider detected. Please install MetaMask or another wallet.');
    }

    //@ts-ignore
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const wallet = {
      address: walletAddress as `0x${string}`, 
      source: 'metamask',
      signMessage: async ({ message }: { message: string }) => {
        return (await signer.signMessage(message)) as `0x${string}`;
      },
      signTransaction: async (tx: ethers.TransactionRequest) => {
        const signedTx = await signer.signTransaction(tx);
        return signedTx as `0x${string}`;
      },
      signTypedData: async (params: {
        domain: ethers.TypedDataDomain;
        types: Record<string, ethers.TypedDataField[]>;
        value: Record<string, any>;
      }) => {
        const signature = await signer.signTypedData(params.domain, params.types, params.value);
        return signature as `0x${string}`;
      },
      publicKey: undefined,
      nonceManager: undefined,
      signAuthorization: undefined,
      sign: undefined,
      type: 'local' as const
    };
//@ts-ignore
      const fetchWithPayment = wrapFetchWithPayment(fetch, wallet);

      const response = await fetchWithPayment(`/api/hackathons/${hackathonId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish hackathon');
      }

      handlePaymentComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish hackathon');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-devspot-dark text-white flex flex-col">
        <Header onSearch={(query) => console.log('Search:', query)} />
        <div className="flex-1 flex">
          <Sidebar activeItem="Hackathons" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-white/20 rounded-full animate-spin border-2 border-white/30 border-t-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-screen bg-devspot-dark text-white flex flex-col">
        <Header onSearch={(query) => console.log('Search:', query)} />
        <div className="flex-1 flex">
          <Sidebar activeItem="Hackathons" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/70 mb-4">{error}</p>
              <button
                onClick={fetchHackathon}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { hackathon, combinedSponsors, combinedResources } = data;

  return (
    <div className="h-screen bg-devspot-dark text-white flex flex-col">
      <Header onSearch={(query) => console.log('Search:', query)} />
      <div className="flex-1 flex">
        <Sidebar activeItem="Hackathons" />
        <div className="flex-1 overflow-y-auto">
          <div className="relative h-32 bg-gradient-to-br from-white/5 via-white/10 to-white/5 border-b border-white/10 backdrop-blur-sm flex items-center justify-center">
            <h1 className="text-3xl font-light text-white">Draft</h1>
          </div>

          <div className="p-8 space-y-8">
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-red-400 font-light">Validation Errors</h3>
                </div>
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-300 text-sm">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-4 border border-red-500/20">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-white">Hackathon Details</h2>
                <div className="flex gap-2">
                  {hackathon.conversation_id && (
                    <button
                      onClick={() => router.push(`/chat/${hackathon.conversation_id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Continue with Spot
                    </button>
                  )}
                  {!editingHackathon ? (
                    <button
                      onClick={() => setEditingHackathon(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={saveHackathon}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingHackathon(false);
                          setHackathonForm(hackathon);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingHackathon ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-white/70 font-light mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200"
                      >
                        Select Logo
                      </button>
                      {hackathonForm.logo && (
                        <img src={hackathonForm.logo} alt="Logo" className="h-12 object-contain" />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white/70 font-light mb-2">Banner</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={(e) => handleImageUpload(e, 'banner')}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200"
                      >
                        Select Banner
                      </button>
                      {hackathonForm.banner && (
                        <img src={hackathonForm.banner} alt="Banner" className="h-12 object-contain" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Title</label>
                    <input
                      type="text"
                      value={hackathonForm.title || ''}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Organization</label>
                    <input
                      type="text"
                      value={hackathonForm.organization || ''}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, organization: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Total Budget ($)</label>
                    <input
                      type="number"
                      min="20000"
                      value={hackathonForm.total_budget || ''}
                      onChange={(e) =>
                        setHackathonForm((prev) => ({
                          ...prev,
                          total_budget: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Format</label>
                    <select
                      value={hackathonForm.format || ''}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, format: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    >
                      <option value="virtual">Virtual</option>
                      <option value="in_person">In Person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Registration Date</label>
                    <input
                      type="datetime-local"
                      value={formatDate(hackathonForm.registration_date)}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, registration_date: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Hacking Start</label>
                    <input
                      type="datetime-local"
                      value={formatDate(hackathonForm.hacking_start)}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, hacking_start: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Submission Deadline</label>
                    <input
                      type="datetime-local"
                      value={formatDate(hackathonForm.submission_deadline)}
                      onChange={(e) => setHackathonForm((prev) => ({ ...prev, submission_deadline: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 font-light mb-2">Event Size</label>
                    <input
                      type="number"
                      value={hackathonForm.event_size || ''}
                      onChange={(e) =>
                        setHackathonForm((prev) => ({
                          ...prev,
                          event_size: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Title</h3>
                    <p className="text-white font-light text-lg">{hackathon.title}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Organization</h3>
                    <p className="text-white font-light">{hackathon.organization}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Total Budget</h3>
                    <p className="text-white font-light">
                      ${hackathon.total_budget?.toLocaleString() || '0'} {hackathon.budget_currency}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Format</h3>
                    <p className="text-white font-light capitalize">{hackathon.format?.replace('_', ' ')}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Registration</h3>
                    <p className="text-white font-light">{formatDisplayDate(hackathon.registration_date)}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-light text-white/70">Hacking Start</h3>
                    <p className="text-white font-light">{formatDisplayDate(hackathon.hacking_start)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-white">Challenges ({hackathon.challenges.length})</h2>
                <button
                  onClick={() => setShowNewChallengeForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Challenge
                </button>
              </div>

              {showNewChallengeForm && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
                  <h3 className="text-lg font-light text-white mb-4">New Challenge</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Challenge title"
                      value={newChallenge.title || ''}
                      onChange={(e) => setNewChallenge((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                    <textarea
                      placeholder="Challenge description"
                      value={newChallenge.description || ''}
                      onChange={(e) => setNewChallenge((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm h-24"
                    />
                    <input
                      type="number"
                      placeholder="Prize amount"
                      value={newChallenge.prize_amount || ''}
                      onChange={(e) =>
                        setNewChallenge((prev) => ({
                          ...prev,
                          prize_amount: e.target.value ? parseInt(e.target.value) : undefined
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                    />
                    <div>
                      <label className="block text-white/70 font-light mb-2">
                        Judging Criteria (minimum 4 required)
                      </label>
                      <div className="space-y-2">
                        {DEFAULT_JUDGING_CRITERIA.map((criteria) => (
                          <label key={criteria} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={newChallenge.judging_criteria?.includes(criteria) || false}
                              onChange={(e) => {
                                const currentCriteria = newChallenge.judging_criteria || [];
                                if (e.target.checked) {
                                  setNewChallenge((prev) => ({
                                    ...prev,
                                    judging_criteria: [...currentCriteria, criteria]
                                  }));
                                } else {
                                  setNewChallenge((prev) => ({
                                    ...prev,
                                    judging_criteria: currentCriteria.filter((c) => c !== criteria)
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-blue-500 bg-white/10 border-white/30 rounded focus:ring-white/30"
                            />
                            <span className="text-white/80 font-light text-sm">{criteria}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={createChallenge}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Create Challenge
                      </button>
                      <button
                        onClick={() => {
                          setShowNewChallengeForm(false);
                          setNewChallenge({});
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {hackathon.challenges.map((challenge, index) => (
                  <div key={challenge.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-light text-white">Challenge {index + 1}</h3>
                      <div className="flex gap-2">
                        {!editingChallenges.includes(challenge.id) ? (
                          <>
                            <button
                              onClick={() => setEditingChallenges((prev) => [...prev, challenge.id])}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200 text-sm"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            {hackathon.challenges.length > 2 && (
                              <button
                                onClick={() => setShowDeleteConfirm(challenge.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => saveChallenge(challenge.id)}
                              disabled={saving}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-all duration-200 disabled:opacity-50 text-sm"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingChallenges((prev) => prev.filter((id) => id !== challenge.id));
                                setChallengeForms((prev) => ({ ...prev, [challenge.id]: challenge }));
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 text-sm"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingChallenges.includes(challenge.id) ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={challengeForms[challenge.id]?.title || ''}
                          onChange={(e) =>
                            setChallengeForms((prev) => ({
                              ...prev,
                              [challenge.id]: { ...prev[challenge.id], title: e.target.value }
                            }))
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                        />
                        <textarea
                          value={challengeForms[challenge.id]?.description || ''}
                          onChange={(e) =>
                            setChallengeForms((prev) => ({
                              ...prev,
                              [challenge.id]: { ...prev[challenge.id], description: e.target.value }
                            }))
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm h-20"
                        />
                        <input
                          type="number"
                          value={challengeForms[challenge.id]?.prize_amount || ''}
                          onChange={(e) =>
                            setChallengeForms((prev) => ({
                              ...prev,
                              [challenge.id]: {
                                ...prev[challenge.id],
                                prize_amount: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }))
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                        />
                        <div>
                          <label className="block text-white/70 font-light mb-2">
                            Judging Criteria (minimum 4 required)
                          </label>
                          <div className="space-y-2">
                            {DEFAULT_JUDGING_CRITERIA.map((criteria) => (
                              <label key={criteria} className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={challengeForms[challenge.id]?.judging_criteria?.includes(criteria) || false}
                                  onChange={(e) => {
                                    const currentCriteria = challengeForms[challenge.id]?.judging_criteria || [];
                                    if (e.target.checked) {
                                      setChallengeForms((prev) => ({
                                        ...prev,
                                        [challenge.id]: {
                                          ...prev[challenge.id],
                                          judging_criteria: [...currentCriteria, criteria]
                                        }
                                      }));
                                    } else {
                                      setChallengeForms((prev) => ({
                                        ...prev,
                                        [challenge.id]: {
                                          ...prev[challenge.id],
                                          judging_criteria: currentCriteria.filter((c) => c !== criteria)
                                        }
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-500 bg-white/10 border-white/30 rounded focus:ring-white/30"
                                />
                                <span className="text-white/80 font-light text-sm">{criteria}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-light text-white text-lg">{challenge.title}</h4>
                        {challenge.description && (
                          <p className="text-white/70 font-light">{challenge.description}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="text-white/80 font-light">
                            Prize: ${challenge.prize_amount?.toLocaleString() || '0'}
                          </span>
                          <span className="text-white/60 font-light">
                            Criteria: {challenge.judging_criteria?.length || 0}
                          </span>
                        </div>
                        {challenge.judging_criteria && challenge.judging_criteria.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {challenge.judging_criteria.map((criteria, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 border border-white/20"
                              >
                                {criteria}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-light text-white mb-4">Ready to Publish?</h2>
                <p className="text-white/70 font-light mb-6">
                  Once published, your hackathon will be live and participants can register.
                </p>
                {validationErrors.length === 0 ? (
                  <button
                    onClick={publishHackathon}
                    disabled={saving || !isWalletConnected}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-xl border border-white/20 transition-all duration-200 disabled:opacity-50 mx-auto backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CreditCard className="w-5 h-5" />
                    Publish Hackathon
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-red-400 mb-4">Please fix all validation errors before publishing</p>
                    <button
                      disabled
                      className="flex items-center gap-3 px-8 py-4 bg-gray-500/20 text-gray-400 rounded-xl border border-gray-500/30 mx-auto opacity-50 cursor-not-allowed"
                    >
                      <CreditCard className="w-5 h-5" />
                      Publish Hackathon
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-md w-full">
            <h3 className="text-white text-lg font-light mb-4">Confirm Delete</h3>
            <p className="text-white/70 mb-6">Are you sure you want to delete this challenge? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteChallenge(showDeleteConfirm)}
                disabled={saving}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-all disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentPopup && (
        <PaymentPopup
          isOpen={showPaymentPopup}
          onClose={() => setShowPaymentPopup(false)}
          paymentDetails={{
            amount: hackathonForm.total_budget?.toString() || '0',
            currency: 'USDC',
            network: 'Base Sepolia',
            sessionId: Math.ceil(Math.random() * 1000000).toString(),
            description: 'Complete the payment to publish your hackathon',
            paymentUrl: ''
          }}
          onPaymentComplete={handlePayment}
          hackathonTitle={hackathonForm.title || 'Your Hackathon'}
        />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DraftHackathonEditPage;