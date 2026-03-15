import { describe, expect, it } from 'vitest';

import { ChatModelCard } from '@/types/llm';

import {
  AddCustomModelCard,
  DeleteCustomModelCard,
  UpdateCustomModelCard,
  customModelCardsReducer,
} from './customModelCard';

describe('customModelCardsReducer', () => {
  const initialState: ChatModelCard[] = [
    {
      contextWindowTokens: 2048,
      description: 'A helpful assistant',
      displayName: 'Model 1',
      enabled: true,
      files: true,
      functionCall: false,
      id: 'model1',
      isCustom: true,
      legacy: false,
      maxOutput: 1000,
      vision: false,
    },
    {
      contextWindowTokens: 1024,
      description: 'A friendly chatbot',
      displayName: 'Model 2',
      files: false,
      functionCall: true,
      id: 'model2',
      isCustom: true,
      legacy: true,
      maxOutput: 500,
      vision: true,
    },
  ];

  it('should add a new custom model card', () => {
    const newModelCard: ChatModelCard = {
      contextWindowTokens: 4096,
      description: 'A versatile assistant',
      displayName: 'Model 3',
      enabled: true,
      files: true,
      functionCall: true,
      id: 'model3',
      isCustom: true,
      legacy: false,
      maxOutput: 2000,
      vision: false,
    };

    const action: AddCustomModelCard = {
      modelCard: newModelCard,
      type: 'add',
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).toContainEqual(newModelCard);
    expect(newState.length).toBe(initialState.length + 1);
  });

  it('should not add a duplicate custom model card', () => {
    const duplicateModelCard: ChatModelCard = {
      contextWindowTokens: 2048,
      description: 'A duplicate model',
      displayName: 'Duplicate Model 1',
      enabled: true,
      files: true,
      functionCall: false,
      id: 'model1',
      isCustom: true,
      legacy: false,
      maxOutput: 1000,
      vision: false,
    };

    const action: AddCustomModelCard = {
      modelCard: duplicateModelCard,
      type: 'add',
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('should delete a custom model card', () => {
    const action: DeleteCustomModelCard = {
      id: 'model1',
      type: 'delete',
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).not.toContainEqual(initialState[0]);
    expect(newState.length).toBe(initialState.length - 1);
  });

  it('should update a custom model card', () => {
    const action: UpdateCustomModelCard = {
      id: 'model1',
      type: 'update',
      value: { displayName: 'Updated Model 1' },
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState.find((card) => card.id === 'model1')?.displayName).toBe('Updated Model 1');
    expect(newState.length).toBe(initialState.length);
  });

  it('should throw an error for unhandled action type', () => {
    const invalidAction = {
      type: 'invalid',
    };

    expect(() => customModelCardsReducer(initialState, invalidAction as any)).toThrowError(
      'Unhandled action type in customModelCardsReducer',
    );
  });

  it('should return the original state if the model card is not found during update', () => {
    const action: UpdateCustomModelCard = {
      id: 'nonexistent',
      type: 'update',
      value: { displayName: 'Updated Nonexistent Model' },
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('should return the original state if the model card ID is missing during add', () => {
    const newModelCard: ChatModelCard = {
      contextWindowTokens: 2048,
      description: 'A new model',
      displayName: 'Model 4',
      enabled: true,
      files: false,
      functionCall: false,
      id: '',
      isCustom: true,
      legacy: false,
      maxOutput: 1500,
      vision: false,
    };

    const action: AddCustomModelCard = {
      modelCard: newModelCard,
      type: 'add',
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('should handle optional properties correctly', () => {
    const newModelCard: ChatModelCard = {
      id: 'model4',
    };

    const action: AddCustomModelCard = {
      modelCard: newModelCard,
      type: 'add',
    };

    const newState = customModelCardsReducer(initialState, action);

    expect(newState).toContainEqual(newModelCard);
  });

  it('should handle an undefined initial state', () => {
    const newModelCard: ChatModelCard = {
      contextWindowTokens: 2048,
      description: 'A new model',
      displayName: 'Model 4',
      enabled: true,
      files: false,
      functionCall: false,
      id: 'model4',
      isCustom: true,
      legacy: false,
      maxOutput: 1500,
      vision: false,
    };

    const action: AddCustomModelCard = {
      modelCard: newModelCard,
      type: 'add',
    };

    const newState = customModelCardsReducer(undefined, action);

    expect(newState).toContainEqual(newModelCard);
    expect(newState.length).toBe(1);
  });
});
