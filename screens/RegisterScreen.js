import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, Paragraph, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await firestore.collection('users').doc(user.uid).set({
        name,
        email,
      });
      navigation.replace('Main');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Title style={styles.title}>Create Account</Title>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />
      <Button 
        mode="contained" 
        onPress={handleRegister} 
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Register
      </Button>
      <Paragraph style={styles.paragraph}>
        Already have an account?{' '}
        <Paragraph style={styles.link} onPress={() => navigation.navigate('Login')}>
          Login here
        </Paragraph>
      </Paragraph>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{
          label: 'Dismiss',
          onPress: () => setError(''),
        }}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  paragraph: {
    marginTop: 20,
    textAlign: 'center',
  },
  link: {
    color: 'blue',
  },
});
