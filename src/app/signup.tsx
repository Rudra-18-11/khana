import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth, useSignUp, useUser } from '@clerk/expo';
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Tag,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  LogOut,
  UserCheck,
} from 'lucide-react-native';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../services/supabase';

export default function SignUpScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { signUp } = useSignUp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('WELCOME50');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Clerk verification state
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const syncProfileDirect = useAuthStore((state) => state.syncProfileDirect);
  const logout = useAuthStore((state) => state.logout);

  // 1. Submit Sign-Up to Clerk
  const handleSignUp = async () => {
    setErrorMessage(null);
    setAccountExists(false);

    if (!emailAddress || !emailAddress.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the Terms and Conditions');
      return;
    }

    setIsLoading(true);

    try {
      if (signUp) {
        const { error } = await signUp.password({
          emailAddress: emailAddress.trim(),
          password,
          firstName: fullName.trim().split(' ')[0] || fullName.trim(),
          lastName: fullName.trim().split(' ').slice(1).join(' ') || undefined,
        });

        if (error) {
          setIsLoading(false);
          const errCode = (error as any)?.code || '';
          const errMsg = error.message || '';

          if (
            errCode === 'form_identifier_exists' ||
            errMsg.toLowerCase().includes('already') ||
            errMsg.toLowerCase().includes('taken') ||
            errMsg.toLowerCase().includes('exists')
          ) {
            setAccountExists(true);
            setErrorMessage('An account with this email address already exists.');
          } else {
            setErrorMessage(errMsg || 'Sign up failed. Please try again.');
          }
          return;
        }

        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setErrorMessage(sendError.message || 'Failed to send verification code.');
          setIsLoading(false);
          return;
        }

        setIsVerifying(true);
        setIsLoading(false);
        return;
      }

      // Offline / Simulated Fallback if Clerk is not ready
      setTimeout(() => {
        setIsVerifying(true);
        setIsLoading(false);
      }, 500);
    } catch (err: any) {
      console.warn('Clerk sign-up error:', err);
      const code = err?.errors?.[0]?.code || '';
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Registration failed. Please try again.';

      if (
        code === 'form_identifier_exists' ||
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('taken') ||
        msg.toLowerCase().includes('exists')
      ) {
        setAccountExists(true);
        setErrorMessage('An account with this email address already exists.');
      } else {
        setErrorMessage(msg);
      }
      setIsLoading(false);
    }
  };

  // 2. Verify Email Code with Clerk
  const handleVerify = async () => {
    setErrorMessage(null);
    const cleanedCode = code.trim();

    if (!cleanedCode) {
      setErrorMessage('Please enter your verification code');
      return;
    }

    setIsLoading(true);

    try {
      let createdUserId = 'user_' + Date.now();

      if (signUp) {
        const { error } = await signUp.verifications.verifyEmailCode({
          code: cleanedCode,
        });

        if (error) {
          setErrorMessage(error.message || 'Invalid verification code');
          setIsLoading(false);
          return;
        }

        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          setErrorMessage(finalizeError.message || 'Failed to finalize account');
          setIsLoading(false);
          return;
        }

        if (signUp.createdUserId) {
          createdUserId = signUp.createdUserId;
        }
      }

      const userProfile = {
        id: createdUserId,
        name: fullName.trim() || emailAddress.split('@')[0],
        email: emailAddress.trim().toLowerCase(),
        phone: phone ? `+91 ${phone.replace(/[^0-9]/g, '')}` : '+91 98765 43210',
        role: 'customer' as const,
      };

      // Direct sync to Supabase database profiles table
      await syncProfileDirect(userProfile);

      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.warn('Clerk verify error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Verification failed. Please check your code.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  // 3. Sign out of existing session to allow registering a new account
  const handleSignOutAndRegister = async () => {
    setIsLoading(true);
    try {
      await signOut();
      logout();
      setFullName('');
      setEmailAddress('');
      setPassword('');
      setCode('');
      setIsVerifying(false);
      setErrorMessage(null);
      setAccountExists(false);
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return null;
  }

  // If already signed in: provide clear options to continue OR sign out & register new account!
  if (isSignedIn) {
    const currentEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      'Active Foodie';

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)')}
          >
            <X size={20} color="#F4ECE1" />
          </TouchableOpacity>
          <Text style={styles.topBrandText}>ACTIVE SESSION</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.signedInBox}>
          <View style={styles.signedInAvatarPill}>
            <UserCheck size={36} color="#D4AF37" />
          </View>
          <Text style={styles.titleText}>You're Already Signed In</Text>
          <Text style={styles.subtitleText}>
            You currently have an active session as{' '}
            <Text style={{ color: '#D4AF37', fontWeight: '800' }}>{currentEmail}</Text>.
          </Text>

          <View style={styles.signedInActionCard}>
            <TouchableOpacity
              style={[styles.submitBtn, styles.submitBtnReady]}
              activeOpacity={0.85}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.submitBtnText}>CONTINUE AS CURRENT USER ❯</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutAndNewBtn}
              activeOpacity={0.85}
              onPress={handleSignOutAndRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#D4AF37" size="small" />
              ) : (
                <>
                  <LogOut size={16} color="#D4AF37" style={{ marginRight: 8 }} />
                  <Text style={styles.signOutAndNewText}>SIGN OUT & CREATE NEW ACCOUNT</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAccountBtn}
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await signOut();
                  logout();
                } catch (e) {}
                router.replace('/login');
              }}
            >
              <Text style={styles.switchAccountText}>Switch to Login Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If waiting for email verification code:
  if (isVerifying) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => setIsVerifying(false)}
          >
            <X size={20} color="#F4ECE1" />
          </TouchableOpacity>
          <Text style={styles.topBrandText}>VERIFY EMAIL</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoPill}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.titleText}>Check Your Inbox</Text>
              <Text style={styles.subtitleText}>
                We've sent a 6-digit confirmation code to{' '}
                <Text style={{ color: '#D4AF37', fontWeight: '800' }}>{emailAddress}</Text>
              </Text>
            </View>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={code}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onChangeText={(val) => {
                    setCode(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, code.length >= 4 && styles.submitBtnReady]}
                activeOpacity={0.85}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#08080C" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>VERIFY & FINISH ❯</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                activeOpacity={0.7}
                onPress={() => handleSignUp()}
              >
                <RotateCcw size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.resendBtnText}>Resend Code via Email</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main Registration Form
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/login');
            }
          }}
        >
          <X size={20} color="#F4ECE1" />
        </TouchableOpacity>
        <Text style={styles.topBrandText}>CREATE ACCOUNT</Text>
        <View style={{ width: 36 }} />
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
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoPill}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.titleText}>Join KHANA Feasts</Text>
            <Text style={styles.subtitleText}>
              Create your foodie profile to unlock exclusive royal discounts & live tracking
            </Text>
          </View>

          {/* Account Already Exists Banner */}
          {accountExists ? (
            <View style={styles.accountExistsCard}>
              <View style={styles.accountExistsTop}>
                <Sparkles size={18} color="#D4AF37" style={{ marginRight: 8 }} />
                <Text style={styles.accountExistsTitle}>Account Already Exists</Text>
              </View>
              <Text style={styles.accountExistsText}>
                An account with{' '}
                <Text style={{ fontWeight: '800', color: '#F4ECE1' }}>{emailAddress}</Text> is
                already registered. Please log in with your password.
              </Text>
              <TouchableOpacity
                style={styles.loginInsteadBtn}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: '/login',
                    params: { email: emailAddress.trim() },
                  });
                }}
              >
                <Text style={styles.loginInsteadBtnText}>LOG IN WITH THIS EMAIL ❯</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeEmailBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setAccountExists(false);
                  setErrorMessage(null);
                  setEmailAddress('');
                }}
              >
                <Text style={styles.changeEmailText}>Use a different email address</Text>
              </TouchableOpacity>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Full Name */}
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputRow}>
              <User size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email Address */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Email Address</Text>
            <View style={[styles.inputRow, accountExists && styles.inputRowError]}>
              <Mail size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={emailAddress}
                onChangeText={(val) => {
                  setEmailAddress(val);
                  if (errorMessage) setErrorMessage(null);
                  if (accountExists) setAccountExists(false);
                }}
              />
            </View>

            {/* Mobile Phone (Optional) */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Mobile Phone (Optional)</Text>
            <View style={styles.inputRow}>
              <Phone size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="98765 43210"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Password */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="rgba(212,175,55,0.8)" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="At least 6 characters"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="rgba(255,255,255,0.4)" />
                ) : (
                  <Eye size={18} color="rgba(255,255,255,0.4)" />
                )}
              </TouchableOpacity>
            </View>

            {/* Referral Code Badge */}
            <View style={styles.referralBox}>
              <Tag size={16} color="#D4AF37" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.referralInput}
                placeholder="Promo Code (Optional)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
              {referralCode === 'WELCOME50' && (
                <View style={styles.appliedBadge}>
                  <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.appliedBadgeText}>₹50 OFF</Text>
                </View>
              )}
            </View>

            {/* Terms & Conditions Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.7}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                {agreedToTerms && <CheckCircle2 size={14} color="#08080C" />}
              </View>
              <Text style={styles.termsText}>
                I agree to KHANA's{' '}
                <Text style={styles.termsHighlight}>Terms of Service</Text> &{' '}
                <Text style={styles.termsHighlight}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                Boolean(emailAddress && password.length >= 6) && styles.submitBtnReady,
              ]}
              activeOpacity={0.85}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#08080C" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>
                  <ArrowRight size={18} color="#08080C" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Required for sign-up flows on Expo web if your application uses legacy bot sign-up protection */}
            <View nativeID="clerk-captcha" />
          </View>

          {/* Already have an account */}
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/login');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color="rgba(212,175,55,0.7)" style={{ marginRight: 6 }} />
            <Text style={styles.trustText}>Secured by Clerk Authentication</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  logoPill: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F4ECE1',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 12.5,
    color: 'rgba(244, 236, 225, 0.6)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
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
  accountExistsCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  accountExistsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountExistsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  accountExistsText: {
    fontSize: 12.5,
    color: 'rgba(244, 236, 225, 0.8)',
    lineHeight: 18,
    marginBottom: 14,
  },
  loginInsteadBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loginInsteadBtnText: {
    color: '#08080C',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  changeEmailBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  changeEmailText: {
    color: 'rgba(244, 236, 225, 0.65)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  form: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  inputRowError: {
    borderColor: '#EF4444',
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
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  referralInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  appliedBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  checkboxActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
    lineHeight: 16,
  },
  termsHighlight: {
    color: '#D4AF37',
    fontWeight: '700',
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
    marginTop: 6,
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
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  resendBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D4AF37',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  loginPromptText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginRight: 6,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4AF37',
    textDecorationLine: 'underline',
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
  signedInBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signedInAvatarPill: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signedInActionCard: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  signOutAndNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  signOutAndNewText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  switchAccountBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchAccountText: {
    color: 'rgba(244, 236, 225, 0.6)',
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
});
