import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Switch, List, Title } from 'react-native-paper';
import { firestore, auth } from '../firebase';

export default function NotificationSettingsScreen() {
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(false);

    useEffect(() => {
        fetchNotificationSettings();
    }, []);

    const fetchNotificationSettings = async () => {
        try {
            const userDoc = await firestore.collection('users').doc(auth.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                setEmailNotifications(userData.emailNotifications || false);
                setPushNotifications(userData.pushNotifications || false);
            }
        } catch (error) {
            console.error('Error fetching notification settings: ', error);
            Alert.alert('Error', 'Failed to load notification settings. Please try again.');
        }
    };

    const updateNotificationSetting = async (type, value) => {
        try {
            await firestore.collection('users').doc(auth.currentUser.uid).update({
                [type]: value,
            });
            if (type === 'emailNotifications') {
                setEmailNotifications(value);
            } else if (type === 'pushNotifications') {
                setPushNotifications(value);
            }
        } catch (error) {
            console.error('Error updating notification setting: ', error);
            Alert.alert('Error', 'Failed to update notification setting. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>Notification Settings</Title>
            <List.Item
                title="Email Notifications"
                right={() => (
                    <Switch
                        value={emailNotifications}
                        onValueChange={(value) => updateNotificationSetting('emailNotifications', value)}
                    />
                )}
            />
            <List.Item
                title="Push Notifications"
                right={() => (
                    <Switch
                        value={pushNotifications}
                        onValueChange={(value) => updateNotificationSetting('pushNotifications', value)}
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