'use client';

import { Button } from '@lobehub/ui';
import { Checkbox, Divider } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

/* eslint-disable sort-keys-fix/sort-keys-fix */

// ============================================================================
// Medical specialties for onboarding
// ============================================================================
const MEDICAL_SPECIALTIES = [
    {
        id: 'internal_medicine',
        icon: '🫀',
        label: 'Nội khoa',
        description: 'Tim mạch, Hô hấp, Tiêu hóa, Nội tiết',
        color: '#ef4444',
    },
    {
        id: 'surgery',
        icon: '🔪',
        label: 'Ngoại khoa',
        description: 'Tổng quát, Chấn thương chỉnh hình, Thần kinh',
        color: '#3b82f6',
    },
    {
        id: 'obstetrics',
        icon: '👶',
        label: 'Sản phụ khoa',
        description: 'Sản khoa, Phụ khoa, Hiếm muộn',
        color: '#ec4899',
    },
    {
        id: 'pediatrics',
        icon: '🧒',
        label: 'Nhi khoa',
        description: 'Nhi tổng quát, Sơ sinh, Nhi nhiễm',
        color: '#f59e0b',
    },
    {
        id: 'pharmacology',
        icon: '💊',
        label: 'Dược lý',
        description: 'Dược lâm sàng, Tương tác thuốc',
        color: '#8b5cf6',
    },
    {
        id: 'research',
        icon: '🔬',
        label: 'Nghiên cứu',
        description: 'Y sinh, Dịch tễ, Thử nghiệm lâm sàng',
        color: '#0ea5e9',
    },
] as const;

// ============================================================================
// Medical plugins to pre-install
// ============================================================================
const MEDICAL_PLUGINS = [
    {
        id: 'pubmed-search',
        icon: '📚',
        name: 'PubMed Search',
        description: 'Tìm kiếm bài báo y khoa từ PubMed/MEDLINE',
        defaultEnabled: true,
    },
    {
        id: 'drug-interactions',
        icon: '💊',
        name: 'Drug Interactions',
        description: 'Kiểm tra tương tác thuốc (42 thuốc, 10 nhóm)',
        defaultEnabled: true,
    },
    {
        id: 'clinical-calculator',
        icon: '🧮',
        name: 'Clinical Calculator',
        description: 'Tính BMI, GFR, MELD, APACHE II, Wells Score...',
        defaultEnabled: true,
    },
    {
        id: 'semantic-scholar',
        icon: '🔍',
        name: 'Semantic Scholar',
        description: 'Tìm kiếm nghiên cứu với AI-powered ranking',
        defaultEnabled: true,
    },
    {
        id: 'doi-resolver',
        icon: '🔗',
        name: 'DOI Resolver',
        description: 'Trích xuất metadata từ DOI/PMID',
        defaultEnabled: true,
    },
    {
        id: 'arxiv',
        icon: '📄',
        name: 'ArXiv Search',
        description: 'Tìm preprint từ ArXiv (BioRxiv, MedRxiv)',
        defaultEnabled: false,
    },
] as const;

// ============================================================================
// Styles
// ============================================================================
const useStyles = createStyles(({ css, token }) => ({
    card: css`
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 16px 12px;
    border: 2px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    text-align: center;
    background: ${token.colorBgContainer};
    transition: all 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  `,
    cardSelected: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
    container: css`
    padding: 24px;
  `,
    description: css`
    font-size: 11px;
    color: ${token.colorTextDescription};
    line-height: 1.3;
  `,
    footer: css`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 8px;
  `,
    grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
  `,
    icon: css`
    font-size: 28px;
  `,
    label: css`
    font-weight: 600;
    font-size: 14px;
    line-height: 1.3;
  `,
    pluginItem: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    transition: all 0.15s ease;

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
    pluginIcon: css`
    font-size: 24px;
    flex-shrink: 0;
  `,
    pluginInfo: css`
    flex: 1;
    min-width: 0;
  `,
    pluginName: css`
    font-weight: 600;
    font-size: 14px;
  `,
    pluginDesc: css`
    font-size: 12px;
    color: ${token.colorTextDescription};
    line-height: 1.3;
  `,
    stepBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #16a34a;
    background: #dcfce7;
  `,
    subtitle: css`
    margin: 0 0 24px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
    title: css`
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
    text-align: center;
  `,
}));

// ============================================================================
// Component
// ============================================================================

type MedicalStep = 'specialty' | 'plugins';

interface MedicalOnboardingProps {
    loading?: boolean;
    onComplete: () => void;
}

const MedicalOnboarding = memo<MedicalOnboardingProps>(({ loading, onComplete }) => {
    const { styles, cx } = useStyles();
    const [step, setStep] = useState<MedicalStep>('specialty');
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
    const [selectedPlugins, setSelectedPlugins] = useState<string[]>(
        MEDICAL_PLUGINS.filter((p) => p.defaultEnabled).map((p) => p.id),
    );

    const handleToggleSpecialty = (id: string) => {
        setSelectedSpecialties((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    };

    const handleTogglePlugin = (id: string) => {
        setSelectedPlugins((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
        );
    };

    const handleSpecialtyContinue = () => {
        setStep('plugins');
    };

    const handlePluginComplete = async () => {
        try {
            // Install selected plugins
            const { useToolStore } = await import('@/store/tool');
            const { useAgentStore } = await import('@/store/agent');
            const { installPlugins } = useToolStore.getState();
            const { togglePlugin } = useAgentStore.getState();

            if (selectedPlugins.length > 0) {
                await installPlugins(selectedPlugins);
                await Promise.all(
                    selectedPlugins.map((pluginId) => togglePlugin(pluginId, true)),
                );
                console.log('✅ Medical plugins installed:', selectedPlugins);
            }

            // Save specialty preference
            const { useUserStore } = await import('@/store/user');
            await useUserStore.getState().updatePreference({
                profession: selectedSpecialties.join(','),
            } as any);
        } catch (error) {
            console.error('Failed to apply medical onboarding:', error);
        }

        onComplete();
    };

    // ====== Step 1: Specialty Select ======
    if (step === 'specialty') {
        return (
            <div className={styles.container}>
                <div className={styles.stepBadge}>🏥 Medical Beta</div>
                <h2 className={styles.title} style={{ marginTop: 12 }}>
                    Chào mừng Bác sĩ! 👋
                </h2>
                <p className={styles.subtitle}>
                    Chọn chuyên khoa của bạn để nhận gợi ý phù hợp
                </p>

                <div className={styles.grid}>
                    {MEDICAL_SPECIALTIES.map((spec) => (
                        <div
                            className={cx(
                                styles.card,
                                selectedSpecialties.includes(spec.id) && styles.cardSelected,
                            )}
                            key={spec.id}
                            onClick={() => handleToggleSpecialty(spec.id)}
                            style={{
                                borderColor: selectedSpecialties.includes(spec.id) ? spec.color : undefined,
                            }}
                        >
                            <span className={styles.icon}>{spec.icon}</span>
                            <span className={styles.label}>{spec.label}</span>
                            <span className={styles.description}>{spec.description}</span>
                        </div>
                    ))}
                </div>

                <Flexbox className={styles.footer}>
                    <Button disabled={loading} onClick={onComplete} type="text">
                        Bỏ qua
                    </Button>
                    <Button
                        disabled={selectedSpecialties.length === 0}
                        loading={loading}
                        onClick={handleSpecialtyContinue}
                        type="primary"
                    >
                        Tiếp tục
                    </Button>
                </Flexbox>
            </div>
        );
    }

    // ====== Step 2: Plugin Tour ======
    return (
        <div className={styles.container}>
            <div className={styles.stepBadge}>🔌 Medical Plugins</div>
            <h2 className={styles.title} style={{ marginTop: 12 }}>
                Plugins Y khoa của bạn
            </h2>
            <p className={styles.subtitle}>
                Các plugins dưới đây đã được cài sẵn. Bật/tắt theo nhu cầu.
            </p>

            <Flexbox gap={8} style={{ marginBottom: 16 }}>
                {MEDICAL_PLUGINS.map((plugin) => (
                    <div className={styles.pluginItem} key={plugin.id}>
                        <span className={styles.pluginIcon}>{plugin.icon}</span>
                        <div className={styles.pluginInfo}>
                            <div className={styles.pluginName}>{plugin.name}</div>
                            <div className={styles.pluginDesc}>{plugin.description}</div>
                        </div>
                        <Checkbox
                            checked={selectedPlugins.includes(plugin.id)}
                            onChange={() => handleTogglePlugin(plugin.id)}
                        />
                    </div>
                ))}
            </Flexbox>

            <Divider style={{ margin: '16px 0' }} />

            <Flexbox className={styles.footer}>
                <Button disabled={loading} onClick={() => setStep('specialty')} type="text">
                    Quay lại
                </Button>
                <Button
                    loading={loading}
                    onClick={handlePluginComplete}
                    type="primary"
                >
                    🏥 Bắt đầu sử dụng
                </Button>
            </Flexbox>
        </div>
    );
});

MedicalOnboarding.displayName = 'MedicalOnboarding';

export default MedicalOnboarding;
