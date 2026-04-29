export type UserProfile = {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunityMeal = {
  id: string;
  createdByUserId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarUrl?: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  isPrivate: boolean;
  likesCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
};
