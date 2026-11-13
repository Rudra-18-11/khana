import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PROMO_BANNERS } from '../services/mockData';
import { fetchBanners } from '../services/supabase';
import { Tag } from 'lucide-react-native';
import { Colors } from '../constants/theme';

interface BannerCarouselProps {
  onSelectCoupon?: (code: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ onSelectCoupon }) => {
  const [banners, setBanners] = useState(PROMO_BANNERS);

  useEffect(() => {
    async function load() {
      const dbBanners = await fetchBanners();
      if (dbBanners && dbBanners.length > 0) {
        const mapped = dbBanners.map((b: any, idx: number) => {
          const colors = ['#E23744', '#1C1C24', '#2563EB', '#D4AF37'];
          return {
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || 'Royal delights on KHANA',
            badge: b.target_type ? b.target_type.toUpperCase() : 'OFFER',
            code: b.target_id || (b.title.includes('50') ? 'WELCOME50' : 'FEAST120'),
            bgColor: colors[idx % colors.length],
          };
        });
        setBanners(mapped);
      }
    }
    load();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={292}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.bannerCard, { backgroundColor: banner.bgColor }]}
            activeOpacity={0.9}
            onPress={() => onSelectCoupon?.(banner.code)}
          >
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{banner.badge}</Text>
              </View>
            </View>

            <Text style={styles.title}>{banner.title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {banner.subtitle}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.codePill}>
                <Tag size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.codeText}>USE {banner.code}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerCard: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 125,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
