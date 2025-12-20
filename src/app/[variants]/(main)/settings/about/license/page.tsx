'use client';

import { Form, Markdown } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BRANDING_NAME } from '@/const/branding';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: 100%;
    max-width: 800px;
  `,
  content: css`
    padding: 24px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
  `,
}));

const LicensePage = memo(() => {
  const { styles } = useStyles();

  const licenseContent = `
# Open Source License Attribution

## About ${BRANDING_NAME}

${BRANDING_NAME} is a derivative work based on [LobeChat](https://github.com/lobehub/lobe-chat), an open-source AI conversation platform developed by LobeHub.

## Apache License 2.0

This project is licensed under the Apache License 2.0. The original LobeChat project and this derivative work are both distributed under the same license.

### Original Work Attribution

- **Original Project**: LobeChat
- **Original Authors**: LobeHub Team
- **Original Repository**: https://github.com/lobehub/lobe-chat
- **License**: Apache License 2.0

### License Notice

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

### Changes Made

This derivative work (${BRANDING_NAME}) includes modifications and customizations to the original LobeChat codebase, including but not limited to:

- Rebranding and custom styling
- Modified configuration and deployment settings
- Additional features and integrations
- Custom business logic and workflows

### Third-Party Dependencies

This project includes various open-source dependencies. Each dependency retains its original license. For a complete list of dependencies and their licenses, please refer to the project's package.json file and the respective dependency documentation.

## Acknowledgments

We extend our gratitude to the LobeHub team and the open-source community for creating and maintaining LobeChat, which serves as the foundation for ${BRANDING_NAME}.

For questions about licensing or to report license-related issues, please contact our support team.
`;

  return (
    <Flexbox align="center" className={styles.container}>
      <Form.Group title="Open Source License" variant="borderless">
        <div className={styles.content}>
          <Markdown>{licenseContent}</Markdown>
        </div>
      </Form.Group>
    </Flexbox>
  );
});

LicensePage.displayName = 'LicensePage';

export default LicensePage;
