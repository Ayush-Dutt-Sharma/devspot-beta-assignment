'use client'
import React from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import HackathonForm from '@/components/forms/HackathonForm'

export default function ManualFormPage() {
  const { user, isLoaded } = useUser()

  if (isLoaded && !user) {
    redirect('/sign-in')
  }

  if (!isLoaded) {
    return (
      <div className="h-screen bg-devspot-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-devspot-dark">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Hackathon</h1>
          <p className="text-devspot-text-secondary">
            Fill out the form below to create your hackathon. All fields marked with * are required.
          </p>
        </div>
        
        <HackathonForm />
      </div>
    </div>
  )
}
