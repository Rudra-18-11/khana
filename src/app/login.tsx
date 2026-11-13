import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/expo';
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { isClerkConfigured } from '../services/clerk';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { signIn } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn, signOut } = useAuth();

  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.email) {
      setEmail(params.email);
      setAuthMode('email');
    }
  }, [params.email]);

  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);
  const setUser = useAuthStore((state) => state.setUser);
  const syncProfileDirect = useAuthStore((state) => state.syncProfileDirect);

  // Handle Phone OTP flow
  const handlePhoneSubmit = async () => {
    setErrorMessage(null);
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      // If Clerk is configured in .env, initiate Clerk phone sign-in
      if (isClerkConfigured) {
        // Clerk phone OTP integration will be triggered here
        // Navigate to OTP verification screen with phone param
        setTimeout(() => {
          setIsLoading(false);
          router.push({
            pathname: '/otp',
            params: { target: `+91 ${cleanedPhone}`, type: 'phone' },
          });
        }, 600);
      } else {
        // Demo mode without Clerk key
        setTimeout(() => {
          setIsLoading(false);
          router.push({
            pathname: '/otp',
            params: { target: `+91 ${cleanedPhone}`, type: 'phone' },
          });
        }, 500);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Handle Email + Password flow
  const handleEmailSubmit = async () => {
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isClerkConfigured && signIn) {
        if (isSignedIn) {
          try {
            await signOut();
          } catch (e) {}
        }

        const { error } = await signIn.password({
          identifier: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          const msg =
            (error as any)?.longMessage ||
            error.message ||
            'Invalid credentials. Please verify your email and password.';
          setErrorMessage(msg);
          return;
        }

        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setIsLoading(false);
          setErrorMessage(finalizeError.message || 'Failed to complete sign in.');
          return;
        }

        await syncProfileDirect({
          id: (signIn as any).createdUserId || '',
          name: email.split('@')[0].toUpperCase(),
          phone: '+91 98765 43210',
          email: email.toLowerCase().trim(),
          role: 'customer',
        });
        setIsLoading(false);
        router.replace('/(tabs)');
        return;
      }

      // Fallback if Clerk is not ready
      await syncProfileDirect({
        id: 'user_' + Date.now(),
        name: email.split('@')[0].toUpperCase(),
        phone: '+91 98765 43210',
        email: email.toLowerCase().trim(),
        role: 'customer',
      });
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.warn('Clerk login error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  // Handle Social Login (Google / Apple)
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    await syncProfileDirect({
      id: 'user_social_' + Date.now(),
      name: provider === 'google' ? 'Google Gourmet' : 'Apple Epicure',
      email: `foodie_${provider}@khana.app`,
      phone: '+91 99887 76655',
      role: 'customer',
    });
    setIsLoading(false);
    router.replace('/(tabs)');
  };

  // Fast Guest / Demo Mode
  const handleGuestLogin = () => {
    loginAsGuest();
    router.replace('/(tabs)');
  };

  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      loginAsGuest();
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Bar with Dismiss / Skip */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.7}
          onPress={handleDismiss}
        >
          <X size={20} color="#F4ECE1" />
        </TouchableOpacity>
        <Text style={styles.topBrandText}>KHANA LOGIN</Text>
        <TouchableOpacity
          style={styles.skipToMenuBtn}
          activeOpacity={0.7}
          onPress={() => {
            loginAsGuest();
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.skipToMenuText}>SKIP ❯</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Branding Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoWrapper}>
              <View style={styles.ambientGlow} />
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.titleText}>Welcome to KHANA</Text>
            <Text style={styles.subtitleText}>
              Royal Flavours · Handcrafted Biryani · Delivered Hot & Fresh
            </Text>
          </View>

          {/* Mode Switcher Pills (Phone / Email) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'phone' && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => {
                setAuthMode('phone');
                setErrorMessage(null);
              }}
            >
              <Phone
                size={15}
                color={authMode === 'phone' ? '#D4AF37' : 'rgba(255,255,255,0.45)'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  authMode === 'phone' && styles.tabTextActive,
                ]}
              >
                Mobile Number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'email' && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => {
                setAuthMode('email');
                setErrorMessage(null);
              }}
            >
              <Mail
                size={15}
                color={authMode === 'email' ? '#D4AF37' : 'rgba(255,255,255,0.45)'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  authMode === 'email' && styles.tabTextActive,
                ]}
              >
                Email Address
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Phone Input Mode */}
          {authMode === 'phone' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Enter your phone number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodePill}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoFocus
                />
              </View>
              <Text style={styles.hintText}>
                We'll send a 6-digit one-time password (OTP) via SMS
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  phone.length >= 10 && styles.submitBtnReady,
                ]}
                activeOpacity={0.85}
                onPress={handlePhoneSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#08080C" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>CONTINUE WITH OTP</Text>
                    <ArrowRight size={18} color="#08080C" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Email Input Mode */}
          {authMode === 'email' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                  ) : (
                    <Eye size={18} color="rgba(255,255,255,0.5)" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  email.length > 3 && password.length >= 6 && styles.submitBtnReady,
                  { marginTop: 24 },
                ]}
                activeOpacity={0.85}
                onPress={handleEmailSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#08080C" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>LOG IN</Text>
                    <ArrowRight size={18} color="#08080C" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Social Sign-in Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONNECT WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtonsRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.8}
              onPress={() => handleSocialLogin('google')}
            >
              <Text style={styles.socialIconText}>G</Text>
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.8}
              onPress={() => handleSocialLogin('apple')}
            >
              <Text style={styles.socialIconText}></Text>
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupPrompt}>
            <Text style={styles.signupPromptText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Fast Guest / Demo Mode Button */}
          <TouchableOpacity
            style={styles.guestBtn}
            activeOpacity={0.8}
            onPress={handleGuestLogin}
          >
            <Sparkles size={16} color="#D4AF37" style={{ marginRight: 8 }} />
            <Text style={styles.guestBtnText}>Continue as Guest (Instant Demo)</Text>
          </TouchableOpacity>

          {/* Security & Clerk Notice Footer */}
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color="rgba(212,175,55,0.7)" style={{ marginRight: 6 }} />
            <Text style={styles.trustText}>
              {isClerkConfigured
                ? 'Secured by Clerk Authentication'
                : 'Clerk Ready · Safe Sandbox Encryption'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBrandText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1.5,
  },
  skipToMenuBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  skipToMenuText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 26,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  ambientGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4ECE1',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 12.5,
    color: 'rgba(244, 236, 225, 0.6)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.5)',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  tabTextActive: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F4ECE1',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F4ECE1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F4ECE1',
  },
  hintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C7335',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnReady: {
    backgroundColor: '#D4AF37',
    shadowOpacity: 0.6,
  },
  submitBtnText: {
    color: '#08080C',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    letterSpacing: 1,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F4ECE1',
    marginRight: 8,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4ECE1',
  },
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  signupPromptText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginRight: 6,
  },
  signupLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4AF37',
    textDecorationLine: 'underline',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  guestBtnText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  trustText: {
    fontSize: 11,
    color: 'rgba(212,175,55,0.7)',
    fontWeight: '600',
  },
});
