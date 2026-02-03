'use client';

import { Modal } from '@lobehub/ui';
import { memo, useCallback, useState } from 'react';

import { useUserStore } from '@/store/user';

import ProfessionSelect from './ProfessionSelect';
import RecommendationModal from './RecommendationModal';
import type { RecommendationSelections } from './professions';

interface OnboardingModalProps {
  onComplete?: () => void;
  open: boolean;
}

type OnboardingStep = 'profession' | 'recommendations';

const OnboardingModal = memo<OnboardingModalProps>(({ open, onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('profession');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);

  // Define markOnboardedAndClose first to avoid "used before defined" error
  const markOnboardedAndClose = useCallback(async () => {
    try {
      // Mark user as onboarded
      await useUserStore.getState().updatePreference({ isOnboarded: true } as any);
    } catch (error) {
      console.error('Failed to mark onboarded:', error);
    }
    onComplete?.();
  }, [onComplete]);

  const handleProfessionComplete = async (profession: string) => {
    setIsSubmitting(true);
    try {
      // Save profession to database
      await useUserStore.getState().updatePreference({ profession } as any);
      // Store selected professions for recommendations step
      setSelectedProfessions(profession.split(','));
      // Move to recommendations step
      setStep('recommendations');
    } catch (error) {
      console.error('Failed to save profession:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfessionSkip = () => {
    // Skip onboarding entirely
    markOnboardedAndClose();
  };

  const handleRecommendationsComplete = async (selections: RecommendationSelections) => {
    setIsSubmitting(true);
    try {
      // Save recommendation selections to database via API
      // This also marks user as onboarded
      const { userService } = await import('@/services/user');
      await userService.saveRecommendations(selections);

      onComplete?.();
    } catch (error) {
      console.error('Failed to save recommendations:', error);
      // Still close modal even if save fails
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecommendationsSkip = () => {
    markOnboardedAndClose();
  };

  const getModalWidth = () => {
    return step === 'profession' ? 640 : 560;
  };

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      maskClosable={false}
      open={open}
      title={null}
      width={getModalWidth()}
    >
      {step === 'profession' && (
        <ProfessionSelect
          loading={isSubmitting}
          onComplete={handleProfessionComplete}
          onSkip={handleProfessionSkip}
        />
      )}
      {step === 'recommendations' && (
        <RecommendationModal
          loading={isSubmitting}
          onComplete={handleRecommendationsComplete}
          onSkip={handleRecommendationsSkip}
          professions={selectedProfessions}
        />
      )}
    </Modal>
  );
});

OnboardingModal.displayName = 'OnboardingModal';

export default OnboardingModal;
