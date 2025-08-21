'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { CreditCard, Shield, Clock } from 'lucide-react'

interface PaymentPageProps {
  params: { id: string }
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { user, isLoaded } = useUser()
  const [hackathon, setHackathon] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchHackathon = async () => {
      try {
        const response = await fetch(`/api/hackathons/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setHackathon(data.hackathon)
        }
      } catch (err) {
        console.error('Error fetching hackathon:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHackathon()
  }, [user, params.id])

  const handlePayment = async () => {
    setPaymentLoading(true)
    // Mock payment process
    setTimeout(() => {
      alert('Payment processed successfully! Your hackathon is now live.')
      window.location.href = '/dashboard'
    }, 2000)
  }

  if (isLoaded && !user) {
    redirect('/sign-in')
  }

  if (loading || !hackathon) {
    return (
      <div className="h-screen bg-devspot-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-devspot-dark p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-devspot-text-secondary">
            Pay the minimum bounty to publish your hackathon
          </p>
        </div>

        <div className="card-primary mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">{hackathon.title}</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-devspot-text-secondary">Minimum Bounty Required:</span>
              <span className="text-white font-medium">$20,000 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-devspot-text-secondary">Processing Fee:</span>
              <span className="text-white font-medium">$0</span>
            </div>
            <div className="border-t border-devspot-gray-600 pt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Total Amount:</span>
                <span className="text-devspot-blue-400">$20,000 USDC</span>
              </div>
            </div>
          </div>

          <div className="bg-devspot-blue-500/10 border border-devspot-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-devspot-blue-400" size={16} />
              <span className="text-devspot-blue-400 font-medium">Secure Payment</span>
            </div>
            <p className="text-devspot-text-secondary text-sm">
              Your payment is secured and will be held in escrow until the hackathon completion.
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={paymentLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {paymentLoading ? (
              <>
                <Clock className="animate-spin" size={16} />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Pay $20,000 USDC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}