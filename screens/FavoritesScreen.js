import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity,ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Searchbar, Chip, Portal, Dialog, IconButton, Text, Divider } from 'react-native-paper';
import { auth, firestore } from '../firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
export default function FavoritesScreen({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('price');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterType, setFilterType] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            // Handle the case when no user is logged in
            return;
        }
        const unsubscribe = firestore.collection('users')
            .doc(currentUser.uid)
            .collection('favorites')
            .onSnapshot(snapshot => {
                const favoriteCars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFavorites(favoriteCars);
            });
        return () => unsubscribe();
    }, []);
    const filteredAndSortedFavorites = favorites
        .filter(car =>
            car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.model.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(car => filterType ? car.type === filterType : true)
        .sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    const renderFavoriteItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Cover source={{ uri: item.imageUrl }} />
            <Card.Content>
                <Title style={styles.cardTitle}>{item.make} {item.model}</Title>
                <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="currency-usd" size={18} color="black" />
                        <Paragraph style={styles.detailText}>${item.price}/day</Paragraph>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="calendar" size={18} color="black" />
                        <Paragraph style={styles.detailText}>{item.year}</Paragraph>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="car" size={18} color="black" />
                        <Paragraph style={styles.detailText}>{item.type}</Paragraph>
                    </View>
                </View>
                <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="seat" size={18} color="black" />
                        <Paragraph style={styles.detailText}>{item.seats} seats</Paragraph>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="gas-station" size={18} color="black" />
                        <Paragraph style={styles.detailText}>{item.fuelType}</Paragraph>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="transmission-tower" size={18} color="black" />
                        <Paragraph style={styles.detailText}>{item.transmission}</Paragraph>
                    </View>
                </View>
            </Card.Content>
            <Divider style={styles.divider} />
            <Card.Actions>
                <Button 
                    mode="outlined" 
                    onPress={() => navigation.navigate('CarDetails', { car: item })}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    icon="car-info"
                >
                    View Details
                </Button>
                <IconButton
                    icon="heart-remove"
                    color="black"
                    size={24}
                    onPress={() => {
                        setSelectedCar(item);
                        setDialogVisible(true);
                    }}
                />
            </Card.Actions>
        </Card>
    );
    const removeFavorite = async () => {
        const currentUser = auth.currentUser;
        if (currentUser && selectedCar) {
            try {
                await firestore.collection('users')
                    .doc(currentUser.uid)
                    .collection('favorites')
                    .doc(selectedCar.id)
                    .delete();
                setDialogVisible(false);
            } catch (error) {
                console.error("Error removing favorite: ", error);
                Alert.alert("Error", "Failed to remove from favorites. Please try again.");
            }
        }
    };
    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search favorites"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                iconColor="black"
                inputStyle={styles.searchbarInput}
            />
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip
                        selected={sortBy === 'price'}
                        onPress={() => setSortBy('price')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon="cash"
                    >
                        Price
                    </Chip>
                    <Chip
                        selected={sortBy === 'year'}
                        onPress={() => setSortBy('year')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon="calendar"
                    >
                        Year
                    </Chip>
                    <Chip
                        selected={sortOrder === 'asc'}
                        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon={sortOrder === 'asc' ? "sort-ascending" : "sort-descending"}
                    >
                        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Chip>
                    <Chip
                        selected={filterType === 'Sedan'}
                        onPress={() => setFilterType(filterType === 'Sedan' ? '' : 'Sedan')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon="car-side"
                    >
                        Sedan
                    </Chip>
                    <Chip
                        selected={filterType === 'SUV'}
                        onPress={() => setFilterType(filterType === 'SUV' ? '' : 'SUV')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon="car-estate"
                    >
                        SUV
                    </Chip>
                    <Chip
                        selected={filterType === 'Truck'}
                        onPress={() => setFilterType(filterType === 'Truck' ? '' : 'Truck')}
                        style={styles.chip}
                        selectedColor="white"
                        textStyle={styles.chipText}
                        icon="truck"
                    >
                        Truck
                    </Chip>
                </ScrollView>
            </View>
            <FlatList
                data={filteredAndSortedFavorites}
                renderItem={renderFavoriteItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyList}>
                        <MaterialCommunityIcons name="heart-off" size={48} color="black" />
                        <Text style={styles.emptyText}>No favorites found</Text>
                    </View>
                }
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('Dashboard')}
                color="white"
            />
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Remove from Favorites</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={styles.dialogContent}>Are you sure you want to remove this car from your favorites?</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} color="black">Cancel</Button>
                        <Button onPress={removeFavorite} color="black">Remove</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    searchbar: {
        margin: 16,
        backgroundColor: 'white',
        elevation: 2,
        borderRadius: 8,
    },
    searchbarInput: {
        color: 'black',
    },
    filterContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    chip: {
        marginRight: 8,
        backgroundColor: 'white',
        borderColor: 'black',
    },
    chipText: {
        color: 'black',
    },
    listContent: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
        borderRadius: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 4,
        fontSize: 14,
    },
    divider: {
        marginVertical: 8,
    },
    button: {
        borderColor: 'black',
    },
    buttonLabel: {
        color: 'black',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: 'black',
    },
    dialog: {
        backgroundColor: 'white',
    },
    dialogTitle: {
        color: 'black',
    },
    dialogContent: {
        color: 'black',
    },
});
