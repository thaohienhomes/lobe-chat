export interface CommonState {
  isOnboard: boolean;
  isShowPWAGuide: boolean;
  isUserCanEnableTrace: boolean;
  isUserHasConversation: boolean;
  isUserStateInit: boolean;
  /**
   * User's current Phở Points balance
   */
  phoPointsBalance?: number;
  /**
   * User's current subscription plan code (e.g., 'vn_free', 'vn_pro', 'gl_lifetime')
   */
  subscriptionPlan?: string;
}

export const initialCommonState: CommonState = {
  isOnboard: false,
  isShowPWAGuide: false,
  isUserCanEnableTrace: false,
  isUserHasConversation: false,
  isUserStateInit: false,
};
