import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button, Title, Paragraph, Avatar, TextInput, Modal, Portal, Card, Divider, List, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDoc = await firestore.collection('users').doc(auth.currentUser.uid).get();
      if (userDoc.exists) {
        setUser(userDoc.data());
        setEditedUser(userDoc.data());
        setNotificationsEnabled(userDoc.data().notificationsEnabled || false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleEdit = () => setEditing(true);

  const handleSave = async () => {
    try {
      await firestore.collection('users').doc(auth.currentUser.uid).update(editedUser);
      setUser(editedUser);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const ref = storage.ref().child(`profilePictures/${auth.currentUser.uid}`);
        await ref.put(blob);
        const url = await ref.getDownloadURL();
        await firestore.collection('users').doc(auth.currentUser.uid).update({ profilePicture: url });
        setUser(prev => ({ ...prev, profilePicture: url }));
        setEditedUser(prev => ({ ...prev, profilePicture: url }));
        Alert.alert('Success', 'Profile picture updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile picture. Please try again.');
      }
    }
  };

  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      await firestore.collection('users').doc(auth.currentUser.uid).update({ notificationsEnabled: newValue });
      setNotificationsEnabled(newValue);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card style={styles.profileCard}>
          <TouchableOpacity onPress={handleImagePick}>
            <Avatar.Image 
              size={100} 
              source={user?.profilePicture ? { uri: user.profilePicture } : require('../assets/icon.png')} 
              style={styles.avatar}
            />
          </TouchableOpacity>
          {editing ? (
            <TextInput
              label="Name"
              value={editedUser.name}
              onChangeText={(text) => handleChange('name', text)}
              style={styles.input}
            />
          ) : (
            <Title style={styles.name}>{user?.name}</Title>
          )}
          <Paragraph style={styles.email}>{auth.currentUser?.email}</Paragraph>
          
          {editing ? (
            <View style={styles.editButtons}>
              <Button mode="contained" onPress={handleSave} style={styles.button}>Save</Button>
              <Button mode="outlined" onPress={handleCancel} style={styles.button}>Cancel</Button>
            </View>
          ) : (
            <Button mode="contained" onPress={handleEdit} style={styles.button}>Edit Profile</Button>
          )}
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Title title="Settings" left={(props) => <MaterialCommunityIcons name="cog" size={24} color="#666" />} />
          <Card.Content>
            <List.Item
              title="Notifications"
              description="Enable push notifications"
              right={() => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />}
            />
            <Divider />
            <List.Item
              title="Change Password"
              description="Update your account password"
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setModalVisible(true)}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* Navigate to Privacy Policy */}}
            />
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </ScrollView>

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Title style={styles.modalTitle}>Change Password</Title>
          <TextInput label="Current Password" secureTextEntry style={styles.input} />
          <TextInput label="New Password" secureTextEntry style={styles.input} />
          <TextInput label="Confirm New Password" secureTextEntry style={styles.input} />
          <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.button}>
            Change Password
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
    margin: 10,
    marginBottom: 5,
  },
  settingsCard: {
    margin: 10,
    marginTop: 5,
  },
  avatar: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    marginVertical: 5,
  },
  logoutButton: {
    margin: 10,
    marginTop: 5,
    backgroundColor: '#ff6b6b',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
