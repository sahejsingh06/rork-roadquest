import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Zap, ShoppingBag, Target, Sparkles } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTrip } from '@/contexts/TripContext';
import { useStore } from '@/contexts/StoreContext';
import { STORE_ITEMS } from '@/constants/storeItems';
import type { ItemCategory } from '@/types/store';

export default function GPStoreScreen() {
  const router = useRouter();
  const { totalGPSPoints } = useTrip();
  const { purchaseItem, ownsItem } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('featured');

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'featured') {
      return STORE_ITEMS.filter(item => item.featured);
    }
    return STORE_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#8E8E93';
      case 'rare':
        return '#0A84FF';
      case 'epic':
        return '#BF5AF2';
      case 'limited':
        return '#FFD700';
      default:
        return theme.colors.dark.textSecondary;
    }
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const handlePurchase = async (itemId: string, price: number, itemName: string) => {
    if (ownsItem(itemId)) {
      Alert.alert('Already Owned', 'You already own this item.');
      return;
    }

    if (totalGPSPoints < price) {
      Alert.alert(
        'Not Enough GP',
        `You need ${price - totalGPSPoints} more GPS Points to purchase this item.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Earn More', onPress: () => router.back() },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${itemName} for ${price} GP?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            const success = await purchaseItem(itemId, totalGPSPoints, price);
            if (success) {
              Alert.alert('Success!', `${itemName} has been added to your inventory.`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1a1a']}
        style={styles.gradient}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <X size={24} color={theme.colors.dark.text} />
            </Pressable>
            <View style={styles.headerContent}>
              <ShoppingBag size={28} color={theme.colors.dark.accent} />
              <View>
                <Text style={styles.headerTitle}>GP Store</Text>
                <Text style={styles.headerSubtitle}>Unlock rewards & boosts</Text>
              </View>
            </View>
            <View style={styles.gpBalance}>
              <Zap size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.gpBalanceText}>{totalGPSPoints}</Text>
            </View>
          </View>

          <View style={styles.earnMoreBanner}>
            <Sparkles size={20} color={theme.colors.dark.accent} />
            <Text style={styles.earnMoreText}>Complete missions to earn more GP</Text>
            <Pressable onPress={() => router.back()} style={styles.earnMoreButton}>
              <Text style={styles.earnMoreButtonText}>Missions</Text>
            </Pressable>
          </View>

          <View style={styles.categoryTabs}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}
            >
              <Pressable
                style={[
                  styles.categoryTab,
                  selectedCategory === 'featured' && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory('featured')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === 'featured' && styles.categoryTabTextActive,
                  ]}
                >
                  Featured
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.categoryTab,
                  selectedCategory === 'cosmetics' && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory('cosmetics')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === 'cosmetics' && styles.categoryTabTextActive,
                  ]}
                >
                  Cosmetics
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.categoryTab,
                  selectedCategory === 'boosts' && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory('boosts')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === 'boosts' && styles.categoryTabTextActive,
                  ]}
                >
                  Boosts
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.categoryTab,
                  selectedCategory === 'utility' && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory('utility')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === 'utility' && styles.categoryTabTextActive,
                  ]}
                >
                  Utility
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.itemsGrid}>
              {filteredItems.map((item) => {
                const owned = ownsItem(item.id);
                const canAfford = totalGPSPoints >= item.price;

                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <Text style={styles.itemIcon}>{item.icon}</Text>
                      <View
                        style={[
                          styles.rarityBadge,
                          { backgroundColor: getRarityColor(item.rarity) },
                        ]}
                      >
                        <Text style={styles.rarityText}>{getRarityLabel(item.rarity)}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.itemFooter}>
                      <View style={styles.itemPrice}>
                        <Zap size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.itemPriceText}>{item.price}</Text>
                      </View>
                      {owned ? (
                        <View style={styles.ownedBadge}>
                          <Text style={styles.ownedText}>Owned</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[
                            styles.buyButton,
                            !canAfford && styles.buyButtonDisabled,
                          ]}
                          onPress={() => handlePurchase(item.id, item.price, item.name)}
                          disabled={!canAfford}
                        >
                          <Text
                            style={[
                              styles.buyButtonText,
                              !canAfford && styles.buyButtonTextDisabled,
                            ]}
                          >
                            Buy
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {filteredItems.length === 0 && (
              <View style={styles.emptyState}>
                <Target size={48} color={theme.colors.dark.textSecondary} />
                <Text style={styles.emptyStateText}>No items in this category yet</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  headerSubtitle: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  gpBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  gpBalanceText: {
    ...theme.typography.callout,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  earnMoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  earnMoreText: {
    flex: 1,
    ...theme.typography.subheadline,
    color: theme.colors.dark.text,
  },
  earnMoreButton: {
    backgroundColor: theme.colors.dark.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  earnMoreButtonText: {
    ...theme.typography.callout,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  categoryTabs: {
    marginBottom: theme.spacing.md,
  },
  categoryTabsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryTabActive: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  categoryTabText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  itemsGrid: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  itemCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  itemIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  itemIcon: {
    fontSize: 48,
  },
  rarityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  rarityText: {
    ...theme.typography.caption2,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  itemName: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
    minHeight: 36,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemPriceText: {
    ...theme.typography.headline,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  buyButton: {
    backgroundColor: theme.colors.dark.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buyButtonText: {
    ...theme.typography.callout,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  buyButtonTextDisabled: {
    color: theme.colors.dark.textSecondary,
  },
  ownedBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.dark.success,
  },
  ownedText: {
    ...theme.typography.callout,
    color: theme.colors.dark.success,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
  },
});
