'use client';

import { ActionIcon, Icon, Text } from '@lobehub/ui';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';

const Header = memo(() => {
    const closeResearchMode = useChatStore((s) => s.closeResearchMode);

    return (
        <Flexbox align={'center'} gap={8} horizontal>
            <ActionIcon icon={ArrowLeft} onClick={() => closeResearchMode()} size={'small'} />
            <Icon icon={FlaskConical} size={16} />
            <Text style={{ fontSize: 16 }} type={'secondary'}>
                Research Mode
            </Text>
        </Flexbox>
    );
});

Header.displayName = 'ResearchHeader';

export default Header;
