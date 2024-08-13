import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Snackbar, useTheme, Text, ProgressBar, IconButton, Chip } from 'react-native-paper';
import { auth, firestore, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
const STEPS = ['Image', 'Details', 'Price', 'Features', 'Location', 'Description'];
export default function AddCarScreen({ navigation }) {
  const [carData, setCarData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
    features: [],
    location: null,
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const theme = useTheme();
  const progress = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / STEPS.length, { duration: 500 });
  }, [currentStep]);
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera roll permission is required to add images.');
        }
      }
    })();
  }, []);
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        nextStep();
      }
    } catch (error) {
      setError('Failed to pick image');
    }
  };
  const handleInputChange = (name, value) => {
    setCarData(prevState => ({ ...prevState, [name]: value }));
  };
  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };
  const handleAddCar = async () => {
    if (!carData.make || !carData.model || !carData.year || !carData.price || !image) {
      setError('Please fill in all required fields and add an image');
      return;
    }
    setLoading(true);
    try {
      const newCarData = {
        ...carData,
        year: parseInt(carData.year),
        price: parseFloat(carData.price),
        ownerId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      const response = await fetch(image);
      const blob = await response.blob();
      const imageName = `car_${Date.now()}.jpg`;
      const storageRef = storage.ref(`carImages/${imageName}`);
      await storageRef.put(blob);
      newCarData.imageUrl = await storageRef.getDownloadURL();
      await firestore.collection('cars').add(newCarData);
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAddFeature = (feature) => {
    setCarData(prevState => ({
      ...prevState,
      features: [...prevState.features, feature]
    }));
  };
  const handleRemoveFeature = (feature) => {
    setCarData(prevState => ({
      ...prevState,
      features: prevState.features.filter(f => f !== feature)
    }));
  };
  const getLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCarData(prevState => ({
        ...prevState,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }));
    } catch (error) {
      setError('Error getting location');
    }
  }, []);
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={50} color={theme.colors.primary} />
                <Text style={styles.imagePickerText}>Tap to add car image</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      case 1:
        return (
          <>
            <TextInput
              label="Make"
              value={carData.make}
              onChangeText={(value) => handleInputChange('make', value)}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Model"
              value={carData.model}
              onChangeText={(value) => handleInputChange('model', value)}
              style={styles.input}
              mode="outlined"
            />
            <Picker
              selectedValue={carData.year}
              onValueChange={(value) => handleInputChange('year', value)}
              style={styles.picker}
            >
              {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <Picker.Item key={year} label={year.toString()} value={year.toString()} />
              ))}
            </Picker>
          </>
        );
      case 2:
        return (
          <TextInput
            label="Price"
            value={carData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
          />
        );
      case 3:
        return (
          <View>
            <Text style={styles.featuresTitle}>Features</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuresContainer}>
              {carData.features.map((feature, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveFeature(feature)}
                  style={styles.featureChip}
                >
                  {feature}
                </Chip>
              ))}
            </ScrollView>
            <TextInput
              label="Add a feature"
              onSubmitEditing={(event) => handleAddFeature(event.nativeEvent.text)}
              style={styles.input}
              mode="outlined"
            />
          </View>
        );
      case 4:
        return (
          <View>
            <Button mode="contained" onPress={getLocation} style={styles.locationButton}>
              Get Current Location
            </Button>
            {carData.location && (
              <Text style={styles.locationText}>
                Location set: {carData.location.latitude.toFixed(4)}, {carData.location.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        );
      case 5:
        return (
          <TextInput
            label="Description"
            value={carData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        );
      default:
        return null;
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Title style={styles.title}>Add Your Car</Title>
          <Text style={styles.stepIndicator}>Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}</Text>
          <Animated.View style={[styles.progressBar, animatedStyles]} />
          <View style={styles.content}>
            {renderStepContent()}
          </View>
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <IconButton
                icon="arrow-left"
                size={30}
                onPress={prevStep}
                style={styles.navButton}
              />
            )}
            {currentStep < STEPS.length - 1 ? (
              <IconButton
                icon="arrow-right"
                size={30}
                onPress={nextStep}
                style={styles.navButton}
              />
            ) : (
              <Button
                mode="contained"
                onPress={handleAddCar}
                style={styles.submitButton}
                loading={loading}
                disabled={loading}
              >
                List My Car
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{ label: 'Dismiss', onPress: () => setError('') }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'blue',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  imagePicker: {
    aspectRatio: 16 / 9,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButton: {
    flex: 1,
    marginLeft: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  picker: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureChip: {
    marginRight: 8,
  },
  locationButton: {
    marginBottom: 16,
  },
  locationText: {
    marginBottom: 16,
  },
});