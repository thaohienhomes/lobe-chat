'use client';

import { FlaskConical } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

const DeepResearchHeader = memo(() => {
    return (
        <Flexbox align={'center'} gap={8} horizontal>
            <FlaskConical size={16} />
            <span>📚 Deep Research</span>
        </Flexbox>
    );
});

DeepResearchHeader.displayName = 'DeepResearchHeader';
export default DeepResearchHeader;
