'use client';

import { Modal } from '@lobehub/ui';
import { memo, useCallback, useState } from 'react';

import { useAgentStore } from '@/store/agent';
import { useToolStore } from '@/store/tool';
import { useUserStore } from '@/store/user';

import ProfessionSelect from './ProfessionSelect';
import RecommendationModal from './RecommendationModal';
import type { RecommendationSelections } from './professions';

interface OnboardingModalProps {
  onComplete?: () => void;
  open: boolean;
}

type OnboardingStep = 'profession' | 'recommendations';

/**
 * Apply the selected recommendations to user settings
 * This actually enables the models, features, plugins, etc.
 */
const applyRecommendations = async (selections: RecommendationSelections) => {
  const { updateDefaultAgent } = useUserStore.getState();
  const { installPlugins } = useToolStore.getState();
  const { togglePlugin } = useAgentStore.getState();

  // Apply default model if selected
  if (selections.defaultModel) {
    await updateDefaultAgent({
      config: {
        model: selections.defaultModel,
      },
    });
    console.log('✅ Applied default model:', selections.defaultModel);
  }

  // Install selected plugins and enable them for current session
  if (selections.enabledPlugins && selections.enabledPlugins.length > 0) {
    try {
      // First install the plugins to database
      await installPlugins(selections.enabledPlugins);
      console.log('✅ Installed plugins:', selections.enabledPlugins);

      // Then enable each plugin for the current session
      for (const pluginId of selections.enabledPlugins) {
        await togglePlugin(pluginId, true);
        console.log('✅ Enabled plugin for session:', pluginId);
      }
    } catch (error) {
      console.error('Failed to install/enable plugins:', error);
    }
  }

  // Note: Features like artifacts, web-search are session-level settings
  // Agents are shown as recommendations on the home screen
  console.log('Applied recommendations:', {
    defaultModel: selections.defaultModel,
    enabledAgents: selections.enabledAgents,
    enabledFeatures: selections.enabledFeatures,
    enabledPlugins: selections.enabledPlugins,
  });
};

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
      // 1. Save recommendation selections to database via API
      // This also marks user as onboarded
      const { userService } = await import('@/services/user');
      await userService.saveRecommendations(selections);

      // 2. Apply the recommendations to user settings
      await applyRecommendations(selections);

      onComplete?.();
    } catch (error) {
      console.error('Failed to save/apply recommendations:', error);
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
