import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Alert, useColorScheme, FlatList, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressBar } from 'react-native-paper'; 
import Toast from 'react-native-toast-message'; 
import { Notifications } from 'expo-notifications';

export default function App() {
  const [waterCount, setWaterCount] = useState(0);
  const [goal, setGoal] = useState(8);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyAverage, setDailyAverage] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // Splash screen 2s
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    saveData();
    if (waterCount === goal) {
      Toast.show({
        type: 'success',
        text1: 'Gratulacje! 🎉',
        text2: 'Osiągnąłeś swój cel dzisiaj!',
      });
    }
    checkLowWaterIntake();
    calculateDailyAverage();
  }, [waterCount]);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('waterCount', waterCount.toString());
      await AsyncStorage.setItem('goal', goal.toString());
      const today = new Date().toISOString().split('T')[0];
      const updatedHistory = [...history.filter(h => h.date !== today), { date: today, count: waterCount }];
      setHistory(updatedHistory);
      await AsyncStorage.setItem('history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.log(error);
    }
  };

  const loadData = async () => {
    try {
      const count = await AsyncStorage.getItem('waterCount');
      const goalStorage = await AsyncStorage.getItem('goal');
      const hist = await AsyncStorage.getItem('history');
      if (count !== null) setWaterCount(parseInt(count));
      if (goalStorage !== null) setGoal(parseInt(goalStorage));
      if (hist !== null) setHistory(JSON.parse(hist));
    } catch (error) {
      console.log(error);
    }
  };

  const addWater = () => {
    if (waterCount < goal) {
      setWaterCount(prev => prev + 1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  };

  const resetWater = () => {
    Alert.alert(
      "Reset Licznika",
      "Czy na pewno chcesz zresetować licznik?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Resetuj", style: "destructive", onPress: () => setWaterCount(0) }
      ]
    );
  };

  const resetHistory = () => {
    Alert.alert(
      "Reset Historii",
      "Czy na pewno chcesz zresetować całą historię?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Resetuj", style: "destructive", onPress: () => setHistory([]) }
      ]
    );
  };

  const progress = Math.min(waterCount / goal, 1);

  const calculateDailyAverage = () => {
    const last7Days = history.slice(-7); // Take last 7 days
    const totalWater = last7Days.reduce((acc, curr) => acc + curr.count, 0);
    setDailyAverage(totalWater / last7Days.length);
  };

  const checkLowWaterIntake = () => {
    if (waterCount < goal * 0.5 && new Date().getHours() < 18) {
      Toast.show({
        type: 'error',
        text1: 'Pij więcej wody! 💦',
        text2: 'Osiągnij połowę swojego celu do 18:00.',
      });
    }
  };

  const setReminder = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pamiętaj o piciu wody! 💧",
        body: "Czas na kolejną szklankę wody!",
      },
      trigger: { seconds: 3600 }, // reminder every hour
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#e0f7fa' }]}>
        <Text style={styles.splashText}>💧 Witaj w Water Tracker!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#e0f7fa' }]}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#ffffff' }]}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#00e5ff' : '#00796b' }]}>💧 Licznik Wody</Text>
        
        <Animated.Text style={[styles.counter, { transform: [{ scale }], color: colorScheme === 'dark' ? '#80deea' : '#004d40' }]}>
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

        <TouchableOpacity style={styles.setGoalButton} onPress={() => {
          Alert.prompt(
            "Nowy Cel",
            "Podaj nową liczbę szklanek:",
            [
              { text: "Anuluj", style: "cancel" },
              {
                text: "Ustaw",
                onPress: (text) => {
                  const number = parseInt(text);
                  if (!isNaN(number) && number > 0) {
                    setGoal(number);
                    setWaterCount(0);
                  }
                }
              }
            ],
            'plain-text'
          );
        }}>
          <Text style={styles.setGoalText}>🎯 Ustaw nowy cel</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 30, width: '100%' }}>
          <Text style={[styles.historyTitle, { color: colorScheme === 'dark' ? '#00e5ff' : '#00796b' }]}>📅 Historia</Text>
          <FlatList
            data={history}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#004d40', fontSize: 16, marginVertical: 2 }}>
                {item.date}: {item.count} szklanek
              </Text>
            )}
          />
        </View>

        <Text style={[styles.historyTitle, { color: colorScheme === 'dark' ? '#00e5ff' : '#00796b' }]}>📊 Średnia z ostatnich 7 dni</Text>
        <Text style={{ color: colorScheme === 'dark' ? '#ffffff' : '#004d40', fontSize: 16 }}>
          {dailyAverage.toFixed(2)} szklanek dziennie
        </Text>

        <TouchableOpacity style={styles.resetHistoryButton} onPress={resetHistory}>
          <Text style={styles.resetHistoryText}>Resetuj historię</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.setReminderButton} onPress={setReminder}>
          <Text style={styles.setReminderText}>Ustaw przypomnienie</Text>
        </TouchableOpacity>

      </Animated.View>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast />
    </View>
  );
}

// STYLE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00bfa5',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 36,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  counter: {
    fontSize: 48,
    marginVertical: 20,
    fontWeight: 'bold',
  },
  progress: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    marginBottom: 30,
    backgroundColor: '#b2dfdb',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  buttonAdd: {
    backgroundColor: '#00bfa5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
  },
  buttonReset: {
    backgroundColor: '#ff5252',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  setGoalButton: {
    marginTop: 25,
  },
  setGoalText: {
    color: '#00796b',
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  historyTitle: {
    fontSize: 22,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  resetHistoryButton: {
    marginTop: 20,
    backgroundColor: '#ffcc00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  resetHistoryText: {
    fontSize: 16,
    color: '#ffffff',
  },
  setReminderButton: {
    marginTop: 20,
    backgroundColor: '#00796b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  setReminderText: {
    fontSize: 16,
    color: '#ffffff',
  },
});
