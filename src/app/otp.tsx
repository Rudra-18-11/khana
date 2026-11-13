import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { useAuthStore } from '../stores/useAuthStore';

export default function OtpScreen() {
  const params = useLocalSearchParams<{ target?: string; type?: string }>();
  const target = params.target || '+91 98765 43210';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);
  const syncProfileDirect = useAuthStore((state) => state.syncProfileDirect);
  const inputRefs = useRef<any[]>([]);

  // Countdown for OTP resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleDigitChange = (value: string, index: number) => {
    setErrorMessage(null);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    if (newOtp.every((digit) => digit !== '') && value) {
      submitOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = (code?: string) => {
    const fullCode = code || otp.join('');
    if (fullCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP');
      return;
    }

    setIsLoading(true);
    syncProfileDirect({
      id: 'user_phone_' + Date.now(),
      name: 'Gourmet Foodie',
      phone: target,
      email: `${target.replace(/[^0-9]/g, '')}@khana.app`,
      role: 'customer',
    }).then(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }).catch(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    });
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#F4ECE1" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>VERIFICATION</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Badge & Title */}
          <View style={styles.badgeRow}>
            <View style={styles.otpBadge}>
              <CheckCircle2 size={14} color="#D4AF37" style={{ marginRight: 6 }} />
              <Text style={styles.otpBadgeText}>SECURE SMS CODE</Text>
            </View>
          </View>

          <Text style={styles.titleText}>Verify Mobile Number</Text>
          <Text style={styles.subtitleText}>
            We've sent a 6-digit confirmation code to{' '}
            <Text style={styles.targetHighlight}>{target}</Text>
          </Text>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* 6 Digit Input Boxes */}
          <View style={styles.otpBoxesRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  index === 0 && !digit ? styles.otpBoxActive : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Hint */}
          <Text style={styles.demoHint}>
            Demo hint: Enter any 6 digits (e.g. 1 2 3 4 5 6) to proceed
          </Text>

          {/* Resend Timer */}
          <View style={styles.resendSection}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerCount}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.resendBtn}
                activeOpacity={0.7}
                onPress={handleResend}
              >
                <RotateCcw size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.resendBtnText}>Resend OTP via SMS</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, isComplete && styles.verifyBtnReady]}
            activeOpacity={0.85}
            onPress={() => submitOtp()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#08080C" size="small" />
            ) : (
              <Text style={styles.verifyBtnText}>VERIFY & FEAST ❯</Text>
            )}
          </TouchableOpacity>
        </View>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  otpBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F4ECE1',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
    marginBottom: 24,
  },
  targetHighlight: {
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
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.25)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#F4ECE1',
  },
  otpBoxFilled: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  otpBoxActive: {
    borderColor: '#D4AF37',
  },
  demoHint: {
    fontSize: 11,
    color: 'rgba(212,175,55,0.6)',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  timerText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.45)',
  },
  timerCount: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  verifyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C7335',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnReady: {
    backgroundColor: '#D4AF37',
    shadowOpacity: 0.6,
  },
  verifyBtnText: {
    color: '#08080C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
