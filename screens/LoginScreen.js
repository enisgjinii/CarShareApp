import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, Paragraph, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      navigation.replace('Main');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Title style={styles.title}>Welcome Back</Title>
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
        onPress={handleLogin} 
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Login
      </Button>
      <Paragraph style={styles.paragraph}>
        Don't have an account?{' '}
        <Paragraph style={styles.link} onPress={() => navigation.navigate('Register')}>
          Register here
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
