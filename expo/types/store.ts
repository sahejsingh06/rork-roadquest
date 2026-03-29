export type ItemCategory = 'featured' | 'cosmetics' | 'boosts' | 'utility' | 'seasonal';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'limited';
export type ItemType = 'car_icon' | 'profile_frame' | 'badge' | 'map_theme' | 'mission_theme' | 'gp_booster' | 'streak_shield' | 'extra_mission' | 'reroll_token' | 'double_claim' | 'advanced_stats' | 'garage_slot' | 'share_template';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: ItemRarity;
  category: ItemCategory;
  type: ItemType;
  icon: string;
  featured?: boolean;
}

export interface UserInventory {
  ownedItems: string[];
  activeBoosts: {
    itemId: string;
    expiresAt: number;
  }[];
}
