import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title, Paragraph, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDoc = await firestore.collection('users').doc(auth.currentUser.uid).get();
      if (userDoc.exists) {
        setUser(userDoc.data());
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileInfo}>
        <Avatar.Icon size={80} icon="account" />
        <Title style={styles.name}>{user?.name}</Title>
        <Paragraph style={styles.email}>{auth.currentUser?.email}</Paragraph>
      </View>
      <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
        Logout
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 50,
  },
  name: {
    fontSize: 24,
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
  logoutButton: {
    marginBottom: 20,
  },
});