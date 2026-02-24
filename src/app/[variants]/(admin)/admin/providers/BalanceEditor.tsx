'use client';

import { useState } from 'react';
import { updateProviderBalance } from './actions';

export function BalanceEditor({ providerId, currentBalance }: { currentBalance: number, providerId: string; }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(currentBalance.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                await updateProviderBalance(providerId, num);
            }
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ color: '#A1A1AA', left: '8px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>$</span>
                    <input
                        autoFocus
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(124, 58, 237, 0.5)',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            outline: 'none',
                            padding: '4px 8px 4px 20px',
                            width: '80px',
                        }}
                        type="number"
                        value={value}
                    />
                </div>
                <button
                    disabled={isSaving}
                    onClick={handleSave}
                    style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '4px',
                        color: '#10B981',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                    }}
                    type="button"
                >
                    {isSaving ? '...' : 'Save'}
                </button>
            </div>
        );
    }

    return (
        <div
            className="hover:border-[rgba(124,58,237,0.5)] hover:bg-[rgba(124,58,237,0.1)]"
            onClick={() => setIsEditing(true)}
            style={{
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                gap: '4px',
                padding: '4px 8px',
                transition: 'all 0.2s',
            }}
            title="Click to update prepaid balance"
        >
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>${currentBalance.toFixed(2)}</span>
            <span style={{ color: '#71717A', fontSize: '10px' }}>✎</span>
        </div>
    );
}
