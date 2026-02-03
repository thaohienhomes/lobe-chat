'use client';

import { Modal } from '@lobehub/ui';
import { memo, useState } from 'react';

import { useUserStore } from '@/store/user';

import ProfessionSelect from './ProfessionSelect';

interface OnboardingModalProps {
  onComplete?: () => void;
  open: boolean;
}

const OnboardingModal = memo<OnboardingModalProps>(({ open, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (profession: string) => {
    setIsSubmitting(true);
    try {
      // Update user profession in database
      await useUserStore.getState().updatePreference({ profession } as any);
      onComplete?.();
    } catch (error) {
      console.error('Failed to save profession:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      maskClosable={false}
      open={open}
      title={null}
      width={640}
    >
      <ProfessionSelect loading={isSubmitting} onComplete={handleComplete} onSkip={handleSkip} />
    </Modal>
  );
});

OnboardingModal.displayName = 'OnboardingModal';

export default OnboardingModal;
