import React, { useEffect } from 'react';
import { SafeAreaView, Image, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1500 }) => {
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={require('../../assets/ChatGPT Image Apr 28, 2026, 02_21_04 AM.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
