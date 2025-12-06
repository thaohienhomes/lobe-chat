export const PLUGIN_SCHEMA_SEPARATOR = '____';
export const PLUGIN_SCHEMA_API_MD5_PREFIX = 'MD5HASH_';

export const ARTIFACT_TAG = 'lobeArtifact';
export const ARTIFACT_THINKING_TAG = 'lobeThinking';

// https://regex101.com/r/TwzTkf/2
// Note: Using regular capture group instead of named group (?<content>...)
// for iOS 15 Safari compatibility (named groups not supported in iOS < 16)
// Sentry issue: PHO-JAVASCRIPT-NEXTJS-7
export const ARTIFACT_TAG_REGEX = /<lobeArtifact\b[^>]*>([\S\s]*?)(?:<\/lobeArtifact>|$)/;

// https://regex101.com/r/r9gqGg/1
export const ARTIFACT_TAG_CLOSED_REGEX = /<lobeArtifact\b[^>]*>([\S\s]*?)<\/lobeArtifact>/;

// https://regex101.com/r/AvPA2g/1
export const ARTIFACT_THINKING_TAG_REGEX = /<lobeThinking\b[^>]*>([\S\s]*?)(?:<\/lobeThinking>|$)/;

export const THINKING_TAG_REGEX = /<think\b[^>]*>([\S\s]*?)(?:<\/think>|$)/;
