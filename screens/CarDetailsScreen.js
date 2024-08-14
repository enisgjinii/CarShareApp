import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, Linking, Platform } from 'react-native';
import { Title, Paragraph, Button, Card, Chip, IconButton, Portal, Modal, Text, useTheme, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { firestore, storage, firebase_app, auth } from '../firebase'; // Adjust the path as needed
const { width } = Dimensions.get('window');
export default function CarDetailsScreen({ route, navigation }) {
    const { car } = route.params;
    const [modalVisible, setModalVisible] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [bookingData, setBookingData] = useState({
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        name: '',
        email: '',
        phone: '',
        frontIdImage: null,
        backIdImage: null,
    });
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [bookingStep, setBookingStep] = useState(0);
    const [user, setUser] = useState(null);
    const theme = useTheme();
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return unsubscribe;
    }, []);
    useEffect(() => {
        fetchAvailability();
    }, [car.id]);
    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to upload ID images.');
            }
        })();
    }, []);
    const fetchAvailability = async () => {
        const bookingsRef = firestore.collection('bookings').where('carId', '==', car.id).where('status', '==', 'confirmed');
        const bookingsSnapshot = await bookingsRef.get();
        const bookingsData = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setAvailability(bookingsData);
    };
    const isDateRangeAvailable = (startDate, endDate) => {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return availability.every(slot => {
            if (slot.status === 'confirmed') {
                const slotStart = slot.startDate.toDate().getTime();
                const slotEnd = slot.endDate.toDate().getTime();
                return (end <= slotStart || start >= slotEnd);
            }
            return true; // If the slot is not confirmed, it's available
        });
    };
    const handleBookNow = () => {
        if (user) {
            setModalVisible(true);
            setBookingStep(0);
        } else {
            navigation.navigate('Login');
        }
    };
    const handleCall = () => {
        Linking.openURL(`tel:${car.ownerPhone}`);
    };
    const handleMessage = () => {
        Linking.openURL(`sms:${car.ownerPhone}`);
    };
    const handleDateChange = (event, selectedDate, isStartDate) => {
        if (Platform.OS === 'android') {
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
        }
        if (selectedDate) {
            const newBookingData = {
                ...bookingData,
                [isStartDate ? 'startDate' : 'endDate']: selectedDate
            };
            if (isDateRangeAvailable(newBookingData.startDate, newBookingData.endDate)) {
                setBookingData(newBookingData);
            } else {
                alert('Selected date range is not available. Please choose different dates.');
            }
        }
    };
    const calculateTotalPrice = () => {
        const days = Math.ceil((bookingData.endDate - bookingData.startDate) / (1000 * 60 * 60 * 24));
        return days * car.price;
    };
    const pickImage = async (isfront) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            setBookingData(prev => ({
                ...prev,
                [isfront ? 'frontIdImage' : 'backIdImage']: result.assets[0].uri
            }));
        }
    };
    const uploadImage = async (uri, path) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const ref = storage.ref().child(path);
        await ref.put(blob);
        return await ref.getDownloadURL();
    };
    const handleConfirmBooking = async () => {
        try {
            if (!bookingData.frontIdImage || !bookingData.backIdImage) {
                alert('Please upload both front and back images of your ID card.');
                return;
            }
            // Check availability again before confirming
            const isAvailable = isDateRangeAvailable(bookingData.startDate, bookingData.endDate);
            if (!isAvailable) {
                alert('Sorry, this date range is no longer available. Please choose different dates.');
                return;
            }
            const frontIdUrl = await uploadImage(bookingData.frontIdImage, `id_cards/${user.uid}_front.jpg`);
            const backIdUrl = await uploadImage(bookingData.backIdImage, `id_cards/${user.uid}_back.jpg`);
            const bookingRef = await firestore.collection('bookings').add({
                userId: user.uid,
                carId: car.id,
                startDate: firebase_app.firestore.Timestamp.fromDate(bookingData.startDate),
                endDate: firebase_app.firestore.Timestamp.fromDate(bookingData.endDate),
                totalPrice: calculateTotalPrice(),
                name: bookingData.name,
                email: bookingData.email,
                phone: bookingData.phone,
                status: 'confirmed',
                frontIdUrl,
                backIdUrl,
                createdAt: firebase_app.firestore.FieldValue.serverTimestamp(),
            });
            console.log('Booking confirmed', bookingRef.id);
            setBookingStep(2);
            // Refresh availability after booking
            fetchAvailability();
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('An error occurred while creating the booking. Please try again.');
        }
    };
    const formatDate = (date) => {
        return date.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    const renderBookingContent = () => {
        switch (bookingStep) {
            case 0:
                return (
                    <>
                        <Title style={{ color: theme.colors.text }}>Select Dates</Title>
                        <Button onPress={() => setShowStartDatePicker(true)} mode="outlined" style={styles.dateButton}>
                            Start Date: {bookingData.startDate.toDateString()}
                        </Button>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={bookingData.startDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, true)}
                            />
                        )}
                        <Button onPress={() => setShowEndDatePicker(true)} mode="outlined" style={styles.dateButton}>
                            End Date: {bookingData.endDate.toDateString()}
                        </Button>
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={bookingData.endDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, false)}
                            />
                        )}
                        <Button onPress={() => setBookingStep(1)} mode="contained" style={styles.nextButton}>
                            Next
                        </Button>
                    </>
                );
            case 1:
                return (
                    <>
                        <Title style={{ color: theme.colors.text }}>Enter Your Details</Title>
                        <TextInput
                            label="Name"
                            value={bookingData.name}
                            onChangeText={(text) => setBookingData(prev => ({ ...prev, name: text }))}
                            style={styles.input}
                        />
                        <TextInput
                            label="Email"
                            value={bookingData.email}
                            onChangeText={(text) => setBookingData(prev => ({ ...prev, email: text }))}
                            keyboardType="email-address"
                            style={styles.input}
                        />
                        <TextInput
                            label="Phone"
                            value={bookingData.phone}
                            onChangeText={(text) => setBookingData(prev => ({ ...prev, phone: text }))}
                            keyboardType="phone-pad"
                            style={styles.input}
                        />
                        <Button onPress={() => pickImage(true)} mode="outlined" style={styles.imageButton}>
                            {bookingData.frontIdImage ? 'Change Front ID Image' : 'Upload Front ID Image'}
                        </Button>
                        <Button onPress={() => pickImage(false)} mode="outlined" style={styles.imageButton}>
                            {bookingData.backIdImage ? 'Change Back ID Image' : 'Upload Back ID Image'}
                        </Button>
                        <Title style={{ color: theme.colors.text, marginTop: 16 }}>Booking Summary</Title>
                        <Text>Start Date: {bookingData.startDate.toDateString()}</Text>
                        <Text>End Date: {bookingData.endDate.toDateString()}</Text>
                        <Text>Total Price: ${calculateTotalPrice()}</Text>
                        <Button onPress={handleConfirmBooking} mode="contained" style={styles.confirmButton}>
                            Confirm Booking
                        </Button>
                    </>
                );
            case 2:
                return (
                    <>
                        <Title style={{ color: theme.colors.text }}>Booking Confirmed</Title>
                        <Paragraph style={{ color: theme.colors.text }}>
                            Your booking has been confirmed. The owner will contact you shortly with further details.
                        </Paragraph>
                        <Button onPress={() => setModalVisible(false)} mode="contained" style={styles.closeButton}>
                            Close
                        </Button>
                    </>
                );
        }
    };
    const DetailItem = ({ icon, label, value }) => (
        <View style={styles.detailItem}>
            <MaterialCommunityIcons name={icon} size={24} color={theme.colors.placeholder} />
            <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
        </View>
    );
    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                        <DetailItem icon="calendar" label="Year" value={car.year} />
                        <DetailItem icon="car" label="Type" value={car.type} />
                        <DetailItem icon="gas-station" label="Fuel" value={car.fuelType} />
                    </View>
                    <View style={styles.detailsRow}>
                        <DetailItem icon="car-shift-pattern" label="Transmission" value={car.transmission} />
                        <DetailItem icon="speedometer" label="Mileage" value={`${car.mileage} mi`} />
                        <DetailItem icon="palette" label="Color" value={car.color} />
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
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                    <Title style={{ color: theme.colors.text }}>Booked Dates</Title>
                    {availability.length > 0 ? (
                        availability.map((slot, index) => (
                            <Text key={index} style={{ color: theme.colors.text }}>
                                {formatDate(slot.startDate)} - {formatDate(slot.endDate)}
                            </Text>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.text }}>No bookings yet</Text>
                    )}
                </Card.Content>
            </Card>
            <View style={[styles.buttonContainer, { backgroundColor: theme.colors.surface }]}>
                <Button
                    mode="contained"
                    onPress={handleBookNow}
                    style={styles.bookButton}
                    color={theme.colors.primary}
                >
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
                    {renderBookingContent()}
                </Modal>
            </Portal>
        </ScrollView>
    );
}
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
    dateButton: {
        marginVertical: 8,
    },
    nextButton: {
        marginTop: 16,
    },
    input: {
        marginBottom: 12,
    },
    imageButton: {
        marginVertical: 8,
    },
    confirmButton: {
        marginTop: 16,
    },
    closeButton: {
        marginTop: 16,
    },
});
