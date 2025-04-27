import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { ProgressBar } from 'react-native-paper'; // UWAGA: trzeba doinstalować

export default function App() {
  const [waterCount, setWaterCount] = useState(0);
  const goal = 8; // Cel: 8 szklanek dziennie
  const scale = useRef(new Animated.Value(1)).current;

  const addWater = () => {
    setWaterCount(prev => prev + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const resetWater = () => {
    setWaterCount(0);
  };

  const progress = Math.min(waterCount / goal, 1);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>💧 Licznik Wody</Text>
        <Animated.Text style={[styles.counter, { transform: [{ scale }] }]}>
          {waterCount} / {goal} szklanek
        </Animated.Text>

        <ProgressBar progress={progress} color="#00bfa5" style={styles.progress} />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonAdd} onPress={addWater}>
            <Text style={styles.buttonText}>+ Szklanka</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonReset} onPress={resetWater}>
            <Text style={styles.buttonText}>Resetuj</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

// STYLE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#00796b',
  },
  counter: {
    fontSize: 48,
    marginVertical: 20,
    color: '#004d40',
    fontWeight: 'bold',
  },
  progress: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    marginBottom: 30,
    backgroundColor: '#b2dfdb',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  buttonAdd: {
    backgroundColor: '#00bfa5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonReset: {
    backgroundColor: '#ff5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
