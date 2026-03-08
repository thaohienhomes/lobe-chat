/**
 * Storyboard output from Agent 3: VisualizationPlanner.
 * Detailed scene breakdowns with visual elements, narration, and interaction points.
 */

import type { RenderTrack } from './concept-map';

export type TargetAudience = 'graduate' | 'highschool' | 'professional' | 'undergraduate';

export type VisualElementType = 'arrow' | 'equation' | 'graph' | 'group' | 'image' | 'shape' | 'text';

export type AnimationType = 'drawLine' | 'fadeIn' | 'highlight' | 'morph' | 'transform' | 'write';

export type InteractionAction = 'click' | 'hover' | 'slider' | 'toggle';

export type SceneTransition = 'fade' | 'morph' | 'none' | 'slide';

export interface VisualElementPosition {
  x: string;
  y: string;
}

export interface VisualElementTiming {
  duration: number;
  start: number;
}

export interface VisualElement {
  animation?: AnimationType;
  description: string;
  position: VisualElementPosition;
  timing?: VisualElementTiming;
  type: VisualElementType;
}

export interface InteractionPoint {
  action: InteractionAction;
  elementId: string;
  response: string;
}

export interface Scene {
  interactionPoints?: InteractionPoint[];
  narration: string;
  purpose: string;
  sceneNumber: number;
  title: string;
  transitionToNext?: SceneTransition;
  visualElements: VisualElement[];
}

export interface Storyboard {
  conceptId: string;
  estimatedDuration: number;
  language: 'en' | 'vi';
  renderTrack: RenderTrack;
  scenes: Scene[];
  targetAudience: TargetAudience;
}
