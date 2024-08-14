import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Snackbar, useTheme, Text, ProgressBar, IconButton, Chip, Menu } from 'react-native-paper';
import { auth, firestore, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

const STEPS = ['Image', 'Details', 'Price', 'Features', 'Location', 'Description'];
const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Truck'];
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'];
const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];

export default function AddCarScreen({ navigation }) {
  const [carData, setCarData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
    features: [],
    location: null,
    type: '',
    fuelType: '',
    transmission: '',
    mileage: '',
    color: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const theme = useTheme();
  const progress = useSharedValue(0);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFuelTypeMenu, setShowFuelTypeMenu] = useState(false);
  const [showTransmissionMenu, setShowTransmissionMenu] = useState(false);

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
      Toast.show({
        type: 'error',
        text1: 'Image Selection Failed',
        text2: 'Please try again',
      });
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

  const validateCarData = () => {
    const requiredFields = ['make', 'model', 'year', 'price', 'type', 'fuelType', 'transmission', 'mileage'];
    const missingFields = requiredFields.filter(field => !carData[field]);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (!image) {
      setError('Please add an image of your car');
      return false;
    }

    if (isNaN(parseFloat(carData.price)) || parseFloat(carData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }

    if (isNaN(parseInt(carData.year)) || parseInt(carData.year) < 1900 || parseInt(carData.year) > new Date().getFullYear()) {
      setError('Please enter a valid year');
      return false;
    }

    if (isNaN(parseInt(carData.mileage)) || parseInt(carData.mileage) < 0) {
      setError('Please enter a valid mileage');
      return false;
    }

    return true;
  };

  const handleAddCar = async () => {
    if (!validateCarData()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: error,
      });
      return;
    }

    setLoading(true);
    try {
      const newCarData = {
        ...carData,
        year: parseInt(carData.year),
        price: parseFloat(carData.price),
        mileage: parseInt(carData.mileage),
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
      Toast.show({
        type: 'success',
        text1: 'Car Added Successfully',
        text2: 'Your car has been listed',
      });
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add car. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = (feature) => {
    if (feature && !carData.features.includes(feature)) {
      setCarData(prevState => ({
        ...prevState,
        features: [...prevState.features, feature]
      }));
    }
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
      Toast.show({
        type: 'success',
        text1: 'Location Set',
        text2: 'Your current location has been added',
      });
    } catch (error) {
      setError('Error getting location');
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Failed to get your location',
      });
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
            <Menu
              visible={showTypeMenu}
              onDismiss={() => setShowTypeMenu(false)}
              anchor={
                <Button onPress={() => setShowTypeMenu(true)}>
                  {carData.type || "Select Car Type"}
                </Button>
              }
            >
              {CAR_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('type', type);
                    setShowTypeMenu(false);
                  }}
                  title={type}
                />
              ))}
            </Menu>
          </>
        );
      case 2:
        return (
          <>
            <TextInput
              label="Price"
              value={carData.price}
              onChangeText={(value) => handleInputChange('price', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Affix text="$" />}
            />
            <TextInput
              label="Mileage"
              value={carData.mileage}
              onChangeText={(value) => handleInputChange('mileage', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              right={<TextInput.Affix text="miles" />}
            />
            <Menu
              visible={showFuelTypeMenu}
              onDismiss={() => setShowFuelTypeMenu(false)}
              anchor={
                <Button onPress={() => setShowFuelTypeMenu(true)}>
                  {carData.fuelType || "Select Fuel Type"}
                </Button>
              }
            >
              {FUEL_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('fuelType', type);
                    setShowFuelTypeMenu(false);
                  }}
                  title={type}
                />
              ))}
            </Menu>
            <Menu
              visible={showTransmissionMenu}
              onDismiss={() => setShowTransmissionMenu(false)}
              anchor={
                <Button onPress={() => setShowTransmissionMenu(true)}>
                  {carData.transmission || "Select Transmission"}
                </Button>
              }
            >
              {TRANSMISSION_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('transmission', type);
                    setShowTransmissionMenu(false);
                  }}
                  title={type}
                />
              ))}
            </Menu>
            <TextInput
              label="Color"
              value={carData.color}
              onChangeText={(value) => handleInputChange('color', value)}
              style={styles.input}
              mode="outlined"
            />
          </>
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
      <Toast ref={(ref) => Toast.setRef(ref)} />
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
