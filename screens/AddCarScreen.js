import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Snackbar, HelperText, IconButton, Surface, useTheme } from 'react-native-paper';
import { auth, firestore, storage, firebase_app } from '../firebase';
import * as ImagePicker from 'expo-image-picker';

console.log('Firebase app:', firebase_app);
console.log('Firebase storage:', storage);

export default function AddCarScreen({ navigation }) {
  const [carData, setCarData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      setError('Failed to pick image');
    }
  };

  const handleInputChange = (name, value) => {
    setCarData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddCar = async () => {
    if (!carData.make || !carData.model || !carData.year || !carData.price) {
      setError('Please fill in all required fields');
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

      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        const imageName = `car_${Date.now()}.jpg`;
        const storageRef = storage.ref(`carImages/${imageName}`);
        await storageRef.put(blob);
        newCarData.imageUrl = await storageRef.getDownloadURL();
      }

      await firestore.collection('cars').add(newCarData);
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Surface style={styles.surface}>
          <Title style={styles.title}>Add a New Car</Title>
          {['make', 'model', 'year', 'price', 'description'].map((field) => (
            <TextInput
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              value={carData[field]}
              onChangeText={(value) => handleInputChange(field, value)}
              style={styles.input}
              mode="outlined"
              keyboardType={field === 'year' || field === 'price' ? 'numeric' : 'default'}
              multiline={field === 'description'}
              numberOfLines={field === 'description' ? 3 : 1}
            />
          ))}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <IconButton icon="camera" size={40} />
            )}
          </TouchableOpacity>
          <Button
            mode="contained"
            onPress={handleAddCar}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Add Car
          </Button>
        </Surface>
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
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
  },
  surface: {
    padding: 16,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
  },
});