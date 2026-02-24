'use client';

import { useUser } from '@clerk/nextjs';
import { Button, Tooltip, theme } from 'antd';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

export default function VoiceSupport() {
    const { user, isLoaded } = useUser();
    const [isCalling, setIsCalling] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const vapiRef = useRef<any>(null);

    const { token } = theme.useToken();

    // Only render on client to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lazily initialize Vapi on client only
    useEffect(() => {
        if (!mounted || !vapiPublicKey || vapiRef.current) return;

        const initVapi = async () => {
            try {
                const VapiModule = await import('@vapi-ai/web');
                const VapiClass = VapiModule.default;
                const instance = new VapiClass(vapiPublicKey);

                instance.on('call-start', () => {
                    console.log('[VoiceSupport] Call started');
                    setIsCalling(true);
                    setIsConnecting(false);
                });

                instance.on('call-end', () => {
                    console.log('[VoiceSupport] Call ended');
                    setIsCalling(false);
                    setIsConnecting(false);
                });

                instance.on('error', (e: any) => {
                    console.error('[VoiceSupport] Vapi Error:', JSON.stringify(e, null, 2));
                    setIsConnecting(false);
                    setIsCalling(false);
                });

                instance.on('speech-start', () => {
                    console.log('[VoiceSupport] AI is speaking');
                });

                instance.on('speech-end', () => {
                    console.log('[VoiceSupport] AI finished speaking');
                });

                vapiRef.current = instance;
                console.log('[VoiceSupport] Vapi initialized successfully');
            } catch (err) {
                console.error('[VoiceSupport] Failed to initialize Vapi:', err);
            }
        };

        initVapi();
    }, [mounted]);

    const toggleCall = useCallback(async () => {
        const vapi = vapiRef.current;
        if (!vapi) {
            console.error('[VoiceSupport] Vapi not initialized');
            return;
        }

        if (isCalling) {
            vapi.stop();
        } else {
            setIsConnecting(true);
            try {
                if (assistantId) {
                    console.log('[VoiceSupport] Starting call with assistant:', assistantId);
                    await vapi.start(assistantId, {
                        variableValues: {
                            userEmail: user?.primaryEmailAddress?.emailAddress || 'N/A',
                            userId: user?.id || 'anonymous',
                            userName: user?.fullName || 'Guest',
                        }
                    });
                } else {
                    // Fallback: use transient assistant (inline config)
                    console.log('[VoiceSupport] Starting call with transient assistant');
                    await vapi.start({
                        model: {
                            messages: [
                                {
                                    content: `You are a friendly support agent for Phở Platform. The user's ID is ${user?.id || 'unknown'}. Speak Vietnamese. Be helpful and concise.`,
                                    role: 'system',
                                }
                            ],
                            model: 'gpt-4o',
                            provider: 'openai',
                        },
                        name: 'Phở Support (Transient)',
                        transcriber: {
                            language: 'vi',
                            model: 'nova-2',
                            provider: 'deepgram',
                        },
                        voice: {
                            provider: 'openai',
                            voiceId: 'alloy',
                        },
                    });
                }
            } catch (e: any) {
                console.error('[VoiceSupport] Start failed:', JSON.stringify(e, null, 2), e?.message, e);
                setIsConnecting(false);
            }
        }
    }, [isCalling, user]);

    // Don't render anything on server or if not configured
    if (!mounted || !vapiPublicKey || !isLoaded) return null;

    return (
        <div style={{ alignItems: 'flex-end', bottom: 24, display: 'flex', flexDirection: 'column', gap: 12, position: 'fixed', right: 24, zIndex: 50 }}>
            {isCalling && (
                <div style={{
                    animation: 'pulse 2s infinite',
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(22, 119, 255, 0.1)',
                    border: '1px solid rgba(22, 119, 255, 0.2)',
                    borderRadius: 20,
                    color: token.colorPrimary,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '8px 16px',
                }}>
                    🔴 Active Support Call...
                </div>
            )}
            <Tooltip title={isCalling ? 'End Call' : 'Talk to Phở Support'}>
                <Button
                    icon={isConnecting ? (
                        <Loader2 style={{ animation: 'spin 1s linear infinite', height: 24, width: 24 }} />
                    ) : (
                        isCalling ? <PhoneOff style={{ height: 24, width: 24 }} /> : <Phone style={{ height: 24, width: 24 }} />
                    )}
                    onClick={toggleCall}
                    shape="circle"
                    size="large"
                    style={{
                        alignItems: 'center',
                        background: isCalling ? token.colorError : token.colorPrimary,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        color: '#fff',
                        display: 'flex',
                        height: 64,
                        justifyContent: 'center',
                        width: 64,
                    }}
                    type="primary"
                />
            </Tooltip>
        </div>
    );
}
