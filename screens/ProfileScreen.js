import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button, Title, Paragraph, Avatar, TextInput, Modal, Portal, Card, Divider, List, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={handleImagePick}>
            <Avatar.Image
              size={120}
              source={user?.profilePicture ? { uri: user.profilePicture } : require('../assets/icon.png')}
              style={styles.avatar}
            />
          </TouchableOpacity>
          {editing ? (
            <TextInput
              label="Name"
              value={editedUser.name}
              onChangeText={(text) => handleChange('name', text)}
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              theme={{ colors: { text: theme.colors.text, placeholder: theme.colors.placeholder } }}
            />
          ) : (
            <Title style={[styles.name, { color: theme.colors.text }]}>{user?.name}</Title>
          )}
          <Paragraph style={[styles.email, { color: theme.colors.placeholder }]}>{auth.currentUser?.email}</Paragraph>
          {editing ? (
            <View style={styles.editButtons}>
              <Button mode="contained" onPress={handleSave} style={styles.button} color={theme.colors.primary}>Save</Button>
              <Button mode="outlined" onPress={handleCancel} style={styles.button} color={theme.colors.primary}>Cancel</Button>
            </View>
          ) : (
            <Button mode="contained" onPress={handleEdit} style={styles.button} color={theme.colors.primary}>Edit Profile</Button>
          )}
        </Card>
        <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Settings"
            titleStyle={{ color: theme.colors.text }}
            left={(props) => <MaterialCommunityIcons name="cog" size={24} color={theme.colors.text} />}
          />
          <Card.Content>
            <List.Item
              title="Notifications"
              titleStyle={{ color: theme.colors.text }}
              description="Enable push notifications"
              descriptionStyle={{ color: theme.colors.placeholder }}
              right={() => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} color={theme.colors.primary} />}
            />
            <Divider style={{ backgroundColor: theme.colors.placeholder }} />
            <List.Item
              title="Change Password"
              titleStyle={{ color: theme.colors.text }}
              description="Update your account password"
              descriptionStyle={{ color: theme.colors.placeholder }}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
              onPress={() => setModalVisible(true)}
            />
            <Divider style={{ backgroundColor: theme.colors.placeholder }} />
            <List.Item
              title="Privacy Policy"
              titleStyle={{ color: theme.colors.text }}
              description="Read our privacy policy"
              descriptionStyle={{ color: theme.colors.placeholder }}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
              onPress={() => {/* Navigate to Privacy Policy */ }}
            />
          </Card.Content>
        </Card>
        <Button mode="contained" onPress={handleLogout} style={styles.logoutButton} color={theme.colors.error}>
          Logout
        </Button>
      </ScrollView>
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Title style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Title>
          <TextInput
            label="Current Password"
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            theme={{ colors: { text: theme.colors.text, placeholder: theme.colors.placeholder } }}
          />
          <TextInput
            label="New Password"
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            theme={{ colors: { text: theme.colors.text, placeholder: theme.colors.placeholder } }}
          />
          <TextInput
            label="Confirm New Password"
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.colors.background }]}
            theme={{ colors: { text: theme.colors.text, placeholder: theme.colors.placeholder } }}
          />
          <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.button} color={theme.colors.primary}>
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
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 4,
  },
  settingsCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
  },
  avatar: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  modalContent: {
    padding: 24,
    margin: 16,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
});