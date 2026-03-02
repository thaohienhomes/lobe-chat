'use client';

import { FlaskConical } from 'lucide-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';

import Action from '../components/Action';

const Research = memo(() => {
    const openResearchMode = useChatStore((s) => s.openResearchMode);

    return (
        <Action
            icon={FlaskConical}
            onClick={() => openResearchMode()}
            title={'Research Mode'}
            tooltipProps={{
                placement: 'bottom',
            }}
        />
    );
});

export default Research;
