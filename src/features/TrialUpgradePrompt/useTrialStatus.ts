'use client';

import useSWR from 'swr';

import type { TrialStatusResponse } from '@/app/api/subscription/trial-status/route';

const fetcher = async (url: string): Promise<TrialStatusResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch trial status');
  }
  return res.json();
};

export function useTrialStatus() {
  const { data, error, isLoading, mutate } = useSWR<TrialStatusResponse>(
    '/api/subscription/trial-status',
    fetcher,
    {
      // Revalidate every 30 seconds
      refreshInterval: 30_000,
      // Don't retry on error
      shouldRetryOnError: false,
      // Keep previous data while revalidating
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    isTrialUser: data?.isTrialUser ?? false,
    maxMessages: data?.maxMessages ?? 10,
    messagesRemaining: data?.messagesRemaining ?? 0,
    mutate,
    planId: data?.planId ?? 'free',
    tokensRemaining: data?.tokensRemaining ?? 0,
    trialExpired: data?.trialExpired ?? false,
  };
}

