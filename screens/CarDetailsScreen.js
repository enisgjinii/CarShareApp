import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, Linking } from 'react-native';
import { Title, Paragraph, Button, Card, Chip, IconButton, Portal, Modal, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function CarDetailsScreen({ route, navigation }) {
    const { car } = route.params;
    const [modalVisible, setModalVisible] = useState(false);
    const theme = useTheme();

    const handleBookNow = () => {
        // Implement booking logic
        setModalVisible(true);
    };

    const handleCall = () => {
        Linking.openURL(`tel:${car.ownerPhone}`);
    };

    const handleMessage = () => {
        Linking.openURL(`sms:${car.ownerPhone}`);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Add back button */}
            <IconButton
                icon="arrow-left"
                color={theme.colors.primary}
                size={24}
                onPress={() => navigation.goBack()}
            />
            <Image source={{ uri: car.imageUrl }} style={styles.image} />
            <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
                <Title style={[styles.title, { color: theme.colors.text }]}>{car.make} {car.model}</Title>
                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: theme.colors.primary }]}>${car.price}</Text>
                    <Text style={[styles.priceSubtext, { color: theme.colors.placeholder }]}>/day</Text>
                </View>
            </View>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                    <View style={styles.detailsRow}>
                        <DetailItem icon="calendar" label="Year" value={car.year} theme={theme} />
                        <DetailItem icon="car" label="Type" value={car.type} theme={theme} />
                        <DetailItem icon="gas-station" label="Fuel" value={car.fuelType} theme={theme} />
                    </View>
                    <View style={styles.detailsRow}>
                        <DetailItem icon="car-shift-pattern" label="Transmission" value={car.transmission} theme={theme} />
                        <DetailItem icon="speedometer" label="Mileage" value={`${car.mileage} mi`} theme={theme} />
                        <DetailItem icon="palette" label="Color" value={car.color} theme={theme} />
                    </View>
                    <Paragraph style={[styles.description, { color: theme.colors.text }]}>{car.description}</Paragraph>
                    <Title style={[styles.featuresTitle, { color: theme.colors.text }]}>Features</Title>
                    <View style={styles.featuresContainer}>
                        {car.features.map((feature, index) => (
                            <Chip key={index} style={styles.featureChip} textStyle={{ color: theme.colors.text }}>{feature}</Chip>
                        ))}
                    </View>
                </Card.Content>
            </Card>
            {car.location && (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Title style={{ color: theme.colors.text }}>Location</Title>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: car.location.latitude,
                                longitude: car.location.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: car.location.latitude,
                                    longitude: car.location.longitude,
                                }}
                            />
                        </MapView>
                    </Card.Content>
                </Card>
            )}
            <View style={[styles.buttonContainer, { backgroundColor: theme.colors.surface }]}>
                <Button mode="contained" onPress={handleBookNow} style={styles.bookButton} color={theme.colors.primary}>
                    Book Now
                </Button>
                <IconButton
                    icon="phone"
                    size={24}
                    onPress={handleCall}
                    style={styles.contactButton}
                    color={theme.colors.primary}
                />
                <IconButton
                    icon="message-text"
                    size={24}
                    onPress={handleMessage}
                    style={styles.contactButton}
                    color={theme.colors.primary}
                />
            </View>
            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <Title style={{ color: theme.colors.text }}>Booking Confirmation</Title>
                    <Paragraph style={{ color: theme.colors.text }}>Your booking request has been sent to the owner. They will contact you shortly to confirm the details.</Paragraph>
                    <Button onPress={() => setModalVisible(false)} color={theme.colors.primary}>Close</Button>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const DetailItem = ({ icon, label, value, theme }) => (
    <View style={styles.detailItem}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.placeholder} />
        <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    priceSubtext: {
        fontSize: 14,
        marginLeft: 4,
    },
    card: {
        margin: 16,
        elevation: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    description: {
        marginTop: 16,
        fontSize: 16,
        lineHeight: 24,
    },
    featuresTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featureChip: {
        margin: 4,
    },
    map: {
        height: 200,
        marginTop: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    bookButton: {
        flex: 1,
        marginRight: 16,
    },
    contactButton: {
        backgroundColor: '#e0e0e0',
    },
    modalContent: {
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
});