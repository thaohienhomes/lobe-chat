'use client';

import { useUser } from '@clerk/nextjs';
import { Modal } from '@lobehub/ui';
import { memo, useCallback, useState } from 'react';

import { useAgentStore } from '@/store/agent';
import { useToolStore } from '@/store/tool';
import { useUserStore } from '@/store/user';

import MedicalOnboarding from './MedicalOnboarding';
import OnboardingProgress from './OnboardingProgress';
import ProfessionSelect from './ProfessionSelect';
import RecommendationModal from './RecommendationModal';
import WelcomeTips from './WelcomeTips';
import type { RecommendationSelections } from './professions';

interface OnboardingModalProps {
  onComplete?: () => void;
  open: boolean;
}

type OnboardingStep = 'profession' | 'recommendations' | 'tips';

/**
 * Apply the selected recommendations to user settings
 * This actually enables the models, features, plugins, etc.
 */
const applyRecommendations = async (selections: RecommendationSelections) => {
  const { updateDefaultAgent } = useUserStore.getState();
  const agentState = useAgentStore.getState();

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
      // --- BATCH INSTALL: fetch manifests in parallel, install each, refresh only once ---
      const { pluginService } = await import('@/services/plugin');
      const { toolService } = await import('@/services/tool');
      const { getBundledPluginById } = await import('@/config/bundledPlugins');
      const { pluginStoreSelectors } = await import('@/store/tool/selectors');
      const toolState = useToolStore.getState();

      // Fetch all manifests in parallel
      const manifestResults = await Promise.allSettled(
        selections.enabledPlugins.map(async (pluginId) => {
          let plugin = pluginStoreSelectors.getPluginById(pluginId)(toolState);
          if (!plugin) {
            const bundled = getBundledPluginById(pluginId);
            if (bundled) plugin = bundled;
          }
          if (!plugin) {
            console.warn(`Plugin not found: ${pluginId}`);
            return null;
          }
          const manifest = await toolService.getToolManifest(plugin.manifest);
          return { identifier: plugin.identifier, manifest };
        }),
      );

      // Install all plugins to DB in parallel (no refreshPlugins per-plugin)
      const installPromises = manifestResults
        .filter(
          (r): r is PromiseFulfilledResult<{ identifier: string; manifest: any }> =>
            r.status === 'fulfilled' && r.value !== null,
        )
        .map((r) =>
          pluginService.installPlugin({
            identifier: r.value.identifier,
            manifest: r.value.manifest,
            type: 'plugin',
          }),
        );
      await Promise.all(installPromises);

      // Refresh plugin list only ONCE after all installs
      await useToolStore.getState().refreshPlugins();
      console.log('✅ Installed plugins:', selections.enabledPlugins);

      // --- BATCH ENABLE: single updateAgentConfig call instead of 6 competing ones ---
      // This avoids AbortController conflicts where each togglePlugin aborts the previous
      const { agentSelectors } = await import('@/store/agent/slices/chat/selectors');
      const { produce } = await import('immer');
      const currentConfig = agentSelectors.currentAgentConfig(agentState);
      const batchedConfig = produce(currentConfig, (draft: any) => {
        const existingPlugins = draft.plugins || [];
        const newPlugins = selections.enabledPlugins!.filter(
          (id: string) => !existingPlugins.includes(id),
        );
        draft.plugins = [...existingPlugins, ...newPlugins];
      });
      await agentState.updateAgentConfig(batchedConfig);
      selections.enabledPlugins.forEach((pluginId) =>
        console.log('✅ Enabled plugin for session:', pluginId),
      );
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

const STEP_INDEX: Record<OnboardingStep, number> = {
  profession: 0,
  recommendations: 1,
  tips: 2,
};

const OnboardingModal = memo<OnboardingModalProps>(({ open, onComplete }) => {
  const { user } = useUser();
  const planId = (user?.publicMetadata as any)?.planId as string | undefined;

  // Show advanced onboarding (specialty + plugins) for:
  // - Medical Beta users
  // - Lifetime Deal users (they get full access to medical/research plugins)
  const showAdvancedOnboarding =
    planId === 'medical_beta' ||
    (user?.publicMetadata as any)?.medical_beta === true ||
    (planId && planId.startsWith('lifetime_')) ||
    planId === 'gl_lifetime';

  const [step, setStep] = useState<OnboardingStep>('profession');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);

  // Define markOnboardedAndClose first to avoid "used before defined" error
  const markOnboardedAndClose = useCallback(async () => {
    try {
      // Mark user as onboarded via the proper server mutation
      const { userService } = await import('@/services/user');
      await userService.makeUserOnboarded();

      // Also update the store so the modal hides immediately
      useUserStore.setState({ isOnboard: true });
    } catch (error) {
      console.error('Failed to mark onboarded:', error);
      // Still update store to prevent modal from re-appearing
      useUserStore.setState({ isOnboard: true });
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
      // Item 11: Validate suggested model IDs against the catalog
      const { getValidModelIds } = await import('@/config/modelCatalog');
      const validIds = getValidModelIds();
      if (selections.defaultModel && !validIds.includes(selections.defaultModel)) {
        console.warn(`[Onboarding] Model "${selections.defaultModel}" not in catalog, falling back`);
        selections.defaultModel = validIds[0]; // fallback to first available
      }

      // 1. Save recommendation selections to database via API
      // This also marks user as onboarded
      const { userService } = await import('@/services/user');
      await userService.saveRecommendations(selections);

      // 2. Apply the recommendations to user settings
      await applyRecommendations(selections);

      // 3. Move to the tips step instead of closing immediately
      setStep('tips');
    } catch (error) {
      console.error('Failed to save/apply recommendations:', error);
      // Still move to tips even if save fails
      setStep('tips');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecommendationsSkip = () => {
    // Skip to tips instead of closing entirely
    setStep('tips');
  };

  const handleTipsComplete = () => {
    // Mark onboarded and close
    markOnboardedAndClose();
  };

  const getModalWidth = () => {
    if (step === 'profession') return 640;
    if (step === 'tips') return 520;
    return 560;
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
      {showAdvancedOnboarding ? (
        <MedicalOnboarding
          loading={isSubmitting}
          onComplete={markOnboardedAndClose}
          planId={planId}
        />
      ) : (
        <>
          {/* Progress indicator */}
          {!showAdvancedOnboarding && (
            <div style={{ paddingBlockStart: 20, paddingInline: 24 }}>
              <OnboardingProgress currentStep={STEP_INDEX[step]} totalSteps={3} />
            </div>
          )}
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
          {step === 'tips' && (
            <WelcomeTips
              loading={isSubmitting}
              onComplete={handleTipsComplete}
            />
          )}
        </>
      )}
    </Modal>
  );
});

OnboardingModal.displayName = 'OnboardingModal';

export default OnboardingModal;
