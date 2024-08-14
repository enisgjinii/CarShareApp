import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Snackbar, useTheme, Text, ProgressBar, IconButton, Chip, Menu } from 'react-native-paper';
import { auth, firestore, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

const STEPS = ['Image', 'Details', 'Specifications', 'Features', 'Location', 'Description'];
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
      showToast('error', 'Image Selection Failed', 'Please try again');
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
      showToast('error', 'Validation Error', error);
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
      showToast('success', 'Car Added Successfully', 'Your car has been listed');
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
      showToast('error', 'Error', 'Failed to add car. Please try again.');
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
      showToast('success', 'Location Set', 'Your current location has been added');
    } catch (error) {
      setError('Error getting location');
      showToast('error', 'Location Error', 'Failed to get your location');
    }
  }, []);

  const showToast = (type, text1, text2) => {
    Toast.show({ type, text1, text2 });
  };

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
            <TextInput
              label="Year"
              value={carData.year}
              onChangeText={(value) => handleInputChange('year', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            <Menu
              visible={carData.showTypeMenu}
              onDismiss={() => handleInputChange('showTypeMenu', false)}
              anchor={
                <Button onPress={() => handleInputChange('showTypeMenu', true)}>
                  {carData.type || "Select Car Type"}
                </Button>
              }
            >
              {CAR_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('type', type);
                    handleInputChange('showTypeMenu', false);
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
              visible={carData.showFuelTypeMenu}
              onDismiss={() => handleInputChange('showFuelTypeMenu', false)}
              anchor={
                <Button onPress={() => handleInputChange('showFuelTypeMenu', true)}>
                  {carData.fuelType || "Select Fuel Type"}
                </Button>
              }
            >
              {FUEL_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('fuelType', type);
                    handleInputChange('showFuelTypeMenu', false);
                  }}
                  title={type}
                />
              ))}
            </Menu>
            <Menu
              visible={carData.showTransmissionMenu}
              onDismiss={() => handleInputChange('showTransmissionMenu', false)}
              anchor={
                <Button onPress={() => handleInputChange('showTransmissionMenu', true)}>
                  {carData.transmission || "Select Transmission"}
                </Button>
              }
            >
              {TRANSMISSION_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    handleInputChange('transmission', type);
                    handleInputChange('showTransmissionMenu', false);
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
          <ProgressBar progress={(currentStep + 1) / STEPS.length} color={theme.colors.primary} style={styles.progressBar} />
          <View style={styles.content}>
            {renderStepContent()}
          </View>
          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <Button
                mode="outlined"
                onPress={prevStep}
                style={styles.navButton}
                icon="arrow-left"
              >
                Previous
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                mode="contained"
                onPress={nextStep}
                style={styles.navButton}
                icon="arrow-right"
              >
                Next
              </Button>
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  stepIndicator: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    height: 6,
    marginBottom: 30,
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
    marginBottom: 20,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    width: '100%',
  },
  imagePickerText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  submitButton: {
    flex: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  featuresContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  featureChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  locationButton: {
    marginBottom: 15,
  },
  locationText: {
    marginBottom: 15,
    color: '#666',
  },
});