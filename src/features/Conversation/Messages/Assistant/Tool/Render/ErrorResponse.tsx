import { Alert, Highlighter } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ChatMessageError, ChatPluginPayload } from '@/types/message';

import PluginSettings from './PluginSettings';

interface ErrorResponseProps extends ChatMessageError {
  id: string;
  plugin?: ChatPluginPayload;
}

const ErrorResponse = memo<ErrorResponseProps>(({ id, type, body, message, plugin }) => {
  const { t } = useTranslation('error');
  if (type === 'PluginSettingsInvalid') {
    return <PluginSettings id={id} plugin={plugin} />;
  }

  const errorKey = type ? `response.${type}` : undefined;
  const displayMessage = errorKey
    ? t(errorKey as any)
    : message || 'Plugin error occurred';

  // If the i18n key wasn't found (returns the key itself), fallback to raw message
  const finalMessage =
    displayMessage === errorKey ? message || type || 'Unknown error' : displayMessage;

  return (
    <Alert
      extra={
        <Flexbox>
          <Highlighter actionIconSize={'small'} language={'json'} variant={'borderless'}>
            {JSON.stringify(body || { message, type }, null, 2)}
          </Highlighter>
        </Flexbox>
      }
      message={finalMessage}
      showIcon
      type={'error'}
    />
  );
});
export default ErrorResponse;
