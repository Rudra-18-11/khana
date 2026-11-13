import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

const { width: windowWidth } = Dimensions.get('window');
const screenWidth = windowWidth > 0 ? windowWidth : 380;
const LOGO_SIZE = Math.min(screenWidth * 0.74, 280);

interface SplashScreenViewProps {
  onFinish?: () => void;
}

const FLOATING_FOODS = [
  { id: '1', emoji: '🍲', label: 'Biryani', x: -115, y: -125 },
  { id: '2', emoji: '🍕', label: 'Pizza', x: 115, y: -125 },
  { id: '3', emoji: '🍔', label: 'Burger', x: 130, y: 15 },
  { id: '4', emoji: '🥟', label: 'Momos', x: 105, y: 155 },
  { id: '5', emoji: '🍰', label: 'Dessert', x: -105, y: 155 },
  { id: '6', emoji: '☕', label: 'Chai', x: -130, y: 15 },
];

const LOADING_STEPS = [
  'Warming up the royal kitchen...',
  'Selecting handpicked ingredients...',
  'Preparing your culinary feast...',
  'Welcome to KHANA!',
];

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);

  // Master entry scale & instant visible logo
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  // Breathing loop animation for logo ambient glow
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // Floating food bobbing animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Steam rising loops
  const steam1 = useRef(new Animated.Value(0)).current;
  const steam2 = useRef(new Animated.Value(0)).current;
  const steam3 = useRef(new Animated.Value(0)).current;

  // Progress line animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Instantly dismiss native OS / Expo Go splash screen so this custom view takes over!
    SplashScreen.hideAsync().catch(() => {});

    // 2. Entrance Fade & Spring
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Subtle Breathing Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Floating Food Badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 8,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Rising Steam Wisps Loops
    const createSteamLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };
    createSteamLoop(steam1, 0).start();
    createSteamLoop(steam2, 450).start();
    createSteamLoop(steam3, 900).start();

    // 6. Dynamic Loading Steps
    const stepTimer1 = setTimeout(() => setStepIndex(1), 700);
    const stepTimer2 = setTimeout(() => setStepIndex(2), 1400);
    const stepTimer3 = setTimeout(() => setStepIndex(3), 2000);

    // 7. Progress Bar Animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2300,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onFinish) {
        onFinish();
      }
    });

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
    };
  }, [breatheAnim, floatAnim1, floatAnim2, logoOpacity, onFinish, progressAnim, scaleAnim, steam1, steam2, steam3]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />


      {/* Center Hero Logo Section */}
      <Animated.View
        style={[
          styles.heroContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: Animated.multiply(scaleAnim, breatheAnim) }],
          },
        ]}
      >
        {/* Soft Golden Ambient Aura */}
        <View style={styles.ambientGlow} />

        {/* Rising Steam Wisps from Pot */}
        <View style={styles.steamContainer}>
          <Animated.View
            style={[
              styles.steamWisp,
              { left: 30 },
              {
                transform: [
                  {
                    translateY: steam1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -28],
                    }),
                  },
                ],
                opacity: steam1.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.85, 0],
                }),
              },
            ]}
          >
            <Text style={styles.steamText}>♨</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.steamWisp,
              { left: 55 },
              {
                transform: [
                  {
                    translateY: steam2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -32],
                    }),
                  },
                ],
                opacity: steam2.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.85, 0],
                }),
              },
            ]}
          >
            <Text style={styles.steamText}>♨</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.steamWisp,
              { left: 80 },
              {
                transform: [
                  {
                    translateY: steam3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -26],
                    }),
                  },
                ],
                opacity: steam3.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0.85, 0],
                }),
              },
            ]}
          >
            <Text style={styles.steamText}>♨</Text>
          </Animated.View>
        </View>

        {/* The Exact KHANA Master Logo Artwork */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.masterLogo}
          resizeMode="contain"
        />

        {/* Orbiting Food Badges around Logo */}
        {FLOATING_FOODS.map((food, index) => {
          const isEven = index % 2 === 0;
          return (
            <Animated.View
              key={food.id}
              style={[
                styles.foodBadge,
                {
                  transform: [
                    { translateX: food.x },
                    { translateY: food.y },
                    { translateY: isEven ? floatAnim1 : floatAnim2 },
                  ],
                },
              ]}
            >
              <Text style={styles.foodEmoji}>{food.emoji}</Text>
              <Text style={styles.foodLabel}>{food.label}</Text>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Royal Tagline & Progress Bar */}
      <View style={styles.bottomSection}>
        <View style={styles.royalBadge}>
          <Text style={styles.royalBadgeText}>ROYAL TASTE · FAST DELIVERY</Text>
        </View>

        {/* Progress Track */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>{LOADING_STEPS[stepIndex]}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Authentic Food · Best Restaurants</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: LOGO_SIZE + 40,
    height: LOGO_SIZE + 40,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    width: LOGO_SIZE * 0.92,
    height: LOGO_SIZE * 0.92,
    borderRadius: (LOGO_SIZE * 0.92) / 2,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 15,
  },
  steamContainer: {
    position: 'absolute',
    top: 20,
    width: 120,
    height: 35,
    zIndex: 15,
  },
  steamWisp: {
    position: 'absolute',
    bottom: 0,
  },
  steamText: {
    color: 'rgba(255, 230, 180, 0.85)',
    fontSize: 16,
    fontWeight: '900',
  },
  masterLogo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  foodBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  foodEmoji: {
    fontSize: 15,
    marginRight: 4,
  },
  foodLabel: {
    color: '#F4ECE1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 26,
    width: '100%',
    paddingHorizontal: 30,
  },
  royalBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 14,
  },
  royalBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  progressContainer: {
    width: '68%',
    alignItems: 'center',
    marginTop: 20,
  },
  progressTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 9,
    letterSpacing: 0.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
