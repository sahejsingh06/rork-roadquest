import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInventory } from '@/types/store';
import { useAuth } from '@/contexts/AuthContext';

const INVENTORY_KEY = '@roadquest_inventory';

export const [StoreProvider, useStore] = createContextHook(() => {
  const { user: authUser } = useAuth();
  const [inventory, setInventory] = useState<UserInventory>({
    ownedItems: [],
    activeBoosts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const getInventoryKey = useCallback((authUserId: string) => {
    return `${INVENTORY_KEY}_${authUserId}`;
  }, []);

  const saveInventory = useCallback(async (inv: UserInventory, authUserId: string) => {
    try {
      const key = getInventoryKey(authUserId);
      await AsyncStorage.setItem(key, JSON.stringify(inv));
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }, [getInventoryKey]);

  const loadInventory = useCallback(async (authUserId: string) => {
    try {
      const key = getInventoryKey(authUserId);
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const inv = JSON.parse(stored) as UserInventory;
        const validBoosts = inv.activeBoosts.filter(boost => boost.expiresAt > Date.now());
        setInventory({ ...inv, activeBoosts: validBoosts });
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getInventoryKey]);

  useEffect(() => {
    if (authUser) {
      loadInventory(authUser.id);
    } else {
      setInventory({ ownedItems: [], activeBoosts: [] });
      setIsLoading(false);
    }
  }, [authUser, loadInventory]);

  const purchaseItem = useCallback(async (itemId: string, currentGP: number, itemPrice: number): Promise<boolean> => {
    if (!authUser || currentGP < itemPrice) {
      return false;
    }

    if (inventory.ownedItems.includes(itemId)) {
      return false;
    }

    const updatedInventory: UserInventory = {
      ...inventory,
      ownedItems: [...inventory.ownedItems, itemId],
    };

    setInventory(updatedInventory);
    await saveInventory(updatedInventory, authUser.id);
    return true;
  }, [authUser, inventory, saveInventory]);

  const activateBoost = useCallback(async (itemId: string, durationMs: number) => {
    if (!authUser) return;

    const updatedInventory: UserInventory = {
      ...inventory,
      activeBoosts: [
        ...inventory.activeBoosts,
        {
          itemId,
          expiresAt: Date.now() + durationMs,
        },
      ],
    };

    setInventory(updatedInventory);
    await saveInventory(updatedInventory, authUser.id);
  }, [authUser, inventory, saveInventory]);

  const ownsItem = useCallback((itemId: string): boolean => {
    return inventory.ownedItems.includes(itemId);
  }, [inventory]);

  const hasActiveBoost = useCallback((itemType: string): boolean => {
    return inventory.activeBoosts.some(boost => 
      boost.itemId.includes(itemType) && boost.expiresAt > Date.now()
    );
  }, [inventory]);

  return {
    inventory,
    isLoading,
    purchaseItem,
    activateBoost,
    ownsItem,
    hasActiveBoost,
  };
});
