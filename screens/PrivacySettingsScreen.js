import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Switch, List, Title } from 'react-native-paper';
import { firestore, auth } from '../firebase';

export default function PrivacySettingsScreen() {
    const [showEmail, setShowEmail] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    useEffect(() => {
        fetchPrivacySettings();
    }, []);

    const fetchPrivacySettings = async () => {
        try {
            const userDoc = await firestore.collection('users').doc(auth.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                setShowEmail(userData.showEmail || false);
                setShowPhone(userData.showPhone || false);
            }
        } catch (error) {
            console.error('Error fetching privacy settings: ', error);
            Alert.alert('Error', 'Failed to load privacy settings. Please try again.');
        }
    };

    const updatePrivacySetting = async (type, value) => {
        try {
            await firestore.collection('users').doc(auth.currentUser.uid).update({
                [type]: value,
            });
            if (type === 'showEmail') {
                setShowEmail(value);
            } else if (type === 'showPhone') {
                setShowPhone(value);
            }
        } catch (error) {
            console.error('Error updating privacy setting: ', error);
            Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Privacy Settings</Title>
            <List.Item
                title="Show Email to Other Users"
                right={() => (
                    <Switch
                        value={showEmail}
                        onValueChange={(value) => updatePrivacySetting('showEmail', value)}
                    />
                )}
            />
            <List.Item
                title="Show Phone Number to Other Users"
                right={() => (
                    <Switch
                        value={showPhone}
                        onValueChange={(value) => updatePrivacySetting('showPhone', value)}
                    />
                )}
            />
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
});