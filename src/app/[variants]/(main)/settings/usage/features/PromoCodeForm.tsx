'use client';

import { Icon } from '@lobehub/ui';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import { Gift, Heart, Loader2, Sparkles } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const { Text, Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
    card: css`
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};
    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      box-shadow: 0 4px 12px ${token.colorFillTertiary};
    }
  `,
    glow: css`
    position: absolute;
    top: -50%;
    left: -50%;
    z-index: 0;

    width: 200%;
    height: 200%;

    background: radial-gradient(
      circle at center,
      ${token.colorPrimaryBg} 0%,
      transparent 70%
    );
    opacity: 0.15;
    pointer-events: none;
  `,
    input: css`
    border-radius: 8px;
    height: 40px;
  `,
    successCard: css`
    background: ${token.colorSuccessBg};
    border: 1px solid ${token.colorSuccessBorder};
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  `,
}));

const PromoCodeForm = memo(() => {
    const { t } = useTranslation('setting');
    const { styles } = useStyles();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activatedPlan, setActivatedPlan] = useState('');
    const [form] = Form.useForm();

    const handleActivate = async (values: { code: string }) => {
        try {
            setLoading(true);
            const response = await fetch('/api/promo/activate', {
                body: JSON.stringify({ code: values.code }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('promoCode.error'));
            }

            message.success(data.message || t('promoCode.success'));
            setActivatedPlan(data.planId);
            setSuccess(true);

            // Force reload to update usage stats and plan status
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className={styles.successCard}>
                <Flexbox align="center" gap={16}>
                    <div style={{ background: '#fff', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,201,167,0.2)', padding: 12 }}>
                        <Heart color="#00C9A7" fill="#00C9A7" size={32} />
                    </div>
                    <Title level={3} style={{ color: '#064E3B', margin: 0 }}>
                        {activatedPlan === 'medical_beta' ? t('promoCode.activated') : t('promoCode.success')}
                    </Title>
                    <Text style={{ fontSize: 16 }}>
                        {t('promoCode.success')}
                    </Text>
                    <Sparkles color="#F59E0B" size={24} style={{ marginTop: 8 }} />
                </Flexbox>
            </Card>
        );
    }

    return (
        <Flexbox gap={16}>
            <Title level={4}>🎁 {t('promoCode.title')}</Title>
            <Card className={styles.card} style={{ position: 'relative' }}>
                <div className={styles.glow} />
                <Flexbox gap={12} style={{ position: 'relative', zIndex: 1 }}>
                    <Text type="secondary">
                        {t('promoCode.description')}
                    </Text>
                    <Form form={form} layout="inline" onFinish={handleActivate} style={{ marginTop: 8 }}>
                        <Form.Item
                            name="code"
                            rules={[{ message: t('promoCode.placeholder'), required: true }]}
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            <Input
                                className={styles.input}
                                placeholder={t('promoCode.placeholder')}
                                prefix={<Icon icon={Gift} style={{ color: '#8c8c8c' }} />}
                            />
                        </Form.Item>
                        <Form.Item style={{ marginRight: 0 }}>
                            <Button
                                disabled={loading}
                                htmlType="submit"
                                icon={loading ? <Icon icon={Loader2} spin /> : <Icon icon={Sparkles} />}
                                style={{ borderRadius: 8, height: 40 }}
                                type="primary"
                            >
                                {t('promoCode.activate')}
                            </Button>
                        </Form.Item>
                    </Form>
                    <Text style={{ fontSize: 12 }} type="secondary">
                        {t('promoCode.description')}
                    </Text>
                </Flexbox>
            </Card>
        </Flexbox>
    );
});

PromoCodeForm.displayName = 'PromoCodeForm';

export default PromoCodeForm;
