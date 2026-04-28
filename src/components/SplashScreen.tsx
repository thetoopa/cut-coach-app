import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1500 }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    if (hasFinished.current) return;

    const timer = setTimeout(() => {
      if (hasFinished.current) return;
      hasFinished.current = true;

      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
