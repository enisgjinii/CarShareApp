import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Image, Share, Animated } from 'react-native';
import { Title, Text, Chip, Searchbar, ActivityIndicator, Modal, Portal, Button, Menu, Card, IconButton, FAB, Snackbar, Avatar, Switch } from 'react-native-paper';
import { firestore } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const filterOptions = ['Sedan', 'SUV', 'Hatchback', 'Truck'];
const sortOptions = [
  { key: 'price', title: 'Price' },
  { key: 'year', title: 'Year' },
  { key: 'distance', title: 'Distance' },
];

const ITEMS_PER_PAGE = 10;

export default function DashboardScreen() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [userLocation, setUserLocation] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const theme = {
    backgroundColor: darkMode ? '#121212' : '#f5f5f5',
    textColor: darkMode ? '#ffffff' : '#333333',
    cardColor: darkMode ? '#1e1e1e' : '#ffffff',
  };

  const fetchCars = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const cachedCars = await AsyncStorage.getItem('cachedCars');
      if (cachedCars) {
        setCars(JSON.parse(cachedCars));
        setLoading(false);
      }

      const snapshot = await firestore.collection('cars')
        .orderBy(sortBy, sortOrder)
        .limit(page * ITEMS_PER_PAGE)
        .get();

      const fetchedCars = snapshot.docs.map(doc => {
        const car = { id: doc.id, ...doc.data() };
        if (userLocation && car.latitude && car.longitude) {
          car.distance = calculateDistance(userLocation, { latitude: car.latitude, longitude: car.longitude });
        }
        return car;
      });

      setCars(fetchedCars);
      setHasMore(fetchedCars.length === page * ITEMS_PER_PAGE);
      await AsyncStorage.setItem('cachedCars', JSON.stringify(fetchedCars));
    } catch (error) {
      setSnackbarMessage('Error fetching cars. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSnackbarMessage('Permission to access location was denied');
        setSnackbarVisible(true);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchCars();
  }, [fetchCars]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };
  const calculateDistance = (location1, location2) => {
    const R = 6371;
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const filteredAndSortedCars = cars
    .filter(car =>
      (car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedFilters.length === 0 || selectedFilters.includes(car.type))
    )
    .sort((a, b) => {
      if (sortBy === 'distance' && userLocation) {
        return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
      }
      return sortOrder === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
    });
  const toggleFavorite = useCallback((car) => {
    firestore.collection('cars').doc(car.id).update({
      isFavorite: !car.isFavorite
    }).then(() => {
      setSnackbarMessage(`${car.make} ${car.model} ${car.isFavorite ? 'removed from' : 'added to'} favorites`);
      setSnackbarVisible(true);
    });
  }, []);
  const shareCar = useCallback(async (car) => {
    try {
      await Share.share({
        message: `Check out this ${car.year} ${car.make} ${car.model} for $${car.price}/day!`,
        url: car.imageUrl,
      });
    } catch (error) {
      setSnackbarMessage('Error sharing car');
      setSnackbarVisible(true);
    }
  }, []);
  const renderCarItem = ({ item }) => {
    const distanceText = item.distance !== undefined && userLocation
      ? `${item.distance.toFixed(1)} km away`
      : 'Distance unavailable';
    return (
      <Card style={viewMode === 'list' ? styles.listItem : styles.gridItem}>
        <Card.Cover source={{ uri: item.imageUrl }} style={viewMode === 'list' ? styles.carImage : styles.carImageGrid} />
        <Card.Content>
          <Title>{item.make} {item.model}</Title>
          <Text>${item.price}/day - {item.year}</Text>
          {userLocation && <Text>{distanceText}</Text>}
        </Card.Content>
        <Card.Actions>
          <IconButton icon={item.isFavorite ? 'heart' : 'heart-outline'} onPress={() => toggleFavorite(item)} />
          <IconButton icon="share" onPress={() => shareCar(item)} />
          <Button onPress={() => navigation.navigate('CarDetails', { car: item })}>Details</Button>
        </Card.Actions>
      </Card>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcons}>
          {[
            { icon: viewMode === 'list' ? 'view-grid' : 'view-list', onPress: () => setViewMode(viewMode === 'list' ? 'grid' : 'list') },
            { icon: 'heart', onPress: () => navigation.navigate('Favorites') },
            { icon: 'map-marker', onPress: () => navigation.navigate('MapView', { cars: filteredAndSortedCars }) },
          ].map((item, index) => (
            <IconButton key={index} icon={item.icon} size={24} onPress={item.onPress} color="#333" />
          ))}
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search cars"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#333"
        />
        <IconButton icon="filter-variant" size={24} onPress={() => setFilterModalVisible(true)} color="#333" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="sort" size={24} onPress={() => setMenuVisible(true)} color="#333" />}
        >
          {sortOptions.map(option => (
            <Menu.Item key={option.key} onPress={() => setSortBy(option.key)} title={option.title} />
          ))}
          <Menu.Item onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title={`Order: ${sortOrder.toUpperCase()}`} />
        </Menu>
      </View>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loading} color="#333" />
      ) : (
        <FlatList
          key={viewMode}
          data={filteredAndSortedCars}
          renderItem={renderCarItem}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Icon name="car-off" size={50} color="#888" />
              <Text style={styles.emptyText}>No cars found</Text>
            </View>
          }
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <Portal>
        <Modal visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Title style={styles.modalTitle}>Filter by Car Type</Title>
          <View style={styles.filterChips}>
            {filterOptions.map(filter => (
              <Chip
                key={filter}
                selected={selectedFilters.includes(filter)}
                onPress={() => setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter])}
                style={styles.filterChip}
                selectedColor="#333"
              >
                {filter}
              </Chip>
            ))}
          </View>
          <Button mode="contained" onPress={() => setFilterModalVisible(false)} style={styles.applyButton}>Apply Filters</Button>
        </Modal>
      </Portal>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddCar')}
        color="#fff"
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold'
  },
  headerIcons: {
    flexDirection: 'row'
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    flex: 1,
    marginRight: 10,
    elevation: 0,
    backgroundColor: 'transparent'
  },
  searchInput: {
    color: '#333',
  },
  listContainer: {
    padding: 10,
  },
  listItem: {
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridItem: {
    flex: 1,
    margin: 5,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  carImage: {
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  carImageGrid: {
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 15,
    color: '#333',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10
  },
  filterChip: {
    margin: 5,
    backgroundColor: '#f0f0f0',
  },
  applyButton: {
    marginTop: 15,
    backgroundColor: '#333',
  },
  emptyList: {
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    marginTop: 10,
    color: '#888'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#333',
  },
  snackbar: {
    backgroundColor: '#333',
  },
});
