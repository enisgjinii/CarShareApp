import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { auth } from '../firebase';

export default function ChangePasswordScreen({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        try {
            const user = auth.currentUser;
            const credential = auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);

            Alert.alert('Success', 'Password updated successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Error changing password: ', error);
            Alert.alert('Error', 'Failed to change password. Please check your current password and try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Change Password</Title>
            <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={styles.input}
            />
            <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={styles.input}
            />
            <TextInput
                label="Confirm New Password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                style={styles.input}
            />
            <Button mode="contained" onPress={handleChangePassword} style={styles.button}>
                Change Password
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginTop: 20,
    },
});