import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { Appbar, Searchbar, Chip, Card, Avatar, Text, Button, Portal, Dialog, List, ProgressBar, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../firebase';
import NetInfo from "@react-native-community/netinfo";

const ITEMS_PER_PAGE = 20;
const FILTER_OPTIONS = ['Sedan', 'SUV', 'Hatchback', 'Truck'];
const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Year: Newest', 'Year: Oldest'];

export default function DashboardScreen() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  const navigation = useNavigation();

  const fetchCars = useCallback(async () => {
    if (!isConnected) {
      showSnackbar('No internet connection. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      let query = firestore.collection('cars');
      
      // Apply filters
      if (filters.length > 0) {
        query = query.where('type', 'in', filters);
      }
      
      // Fetch all matching documents
      const snapshot = await query.get();
      let fetchedCars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Apply sorting in JavaScript
      fetchedCars.sort((a, b) => {
        if (sortBy === 'price') {
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        } else { // year
          return sortOrder === 'asc' ? a.year - b.year : b.year - a.year;
        }
      });
      
      // Limit the results
      fetchedCars = fetchedCars.slice(0, ITEMS_PER_PAGE);
      
      setCars(fetchedCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
      showSnackbar('Failed to fetch cars. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, sortOrder, filters, isConnected]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCars();
  }, [fetchCars]);

  const filteredCars = cars.filter(car =>
    car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCarItem = ({ item }) => (
    <Card style={styles.carItem} onPress={() => navigation.navigate('CarDetails', { car: item })}>
      <Card.Title
        title={`${item.make} ${item.model}`}
        subtitle={`${item.year} - ${item.type}`}
        left={(props) => <Avatar.Image {...props} source={{ uri: item.imageUrl }} />}
      />
      <Card.Content>
        <Text style={styles.priceText}>{`$${item.price}/day`}</Text>
        <Text>{`Mileage: ${item.mileage} km`}</Text>
        <Text>{`Fuel: ${item.fuelType}`}</Text>
      </Card.Content>
    </Card>
  );

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const applySort = (index) => {
    setSortBy(index % 2 === 0 ? 'price' : 'year');
    setSortOrder(index < 2 ? 'asc' : 'desc');
    setMenuVisible(false);
    fetchCars();
  };

  const toggleFilter = (filter) => {
    setFilters(curr =>
      curr.includes(filter) ? curr.filter(f => f !== filter) : [...curr, filter]
    );
    fetchCars();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Car Rentals" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="sort-variant" onPress={() => setMenuVisible(true)} />
      </Appbar.Header>
      <Searchbar
        placeholder="Search cars"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <View style={styles.filterChips}>
        {FILTER_OPTIONS.map(filter => (
          <Chip
            key={filter}
            selected={filters.includes(filter)}
            onPress={() => toggleFilter(filter)}
            style={styles.chip}
          >{filter}</Chip>
        ))}
      </View>
      <FlatList
        data={filteredCars}
        renderItem={renderCarItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No cars found. Try adjusting your filters.</Text>
        }
      />
      {loading && <ProgressBar indeterminate style={styles.progressBar} />}
      <Portal>
        <Dialog visible={menuVisible} onDismiss={() => setMenuVisible(false)}>
          <Dialog.Title>Sort By</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              {SORT_OPTIONS.map((option, index) => (
                <List.Item
                  key={index}
                  title={option}
                  onPress={() => applySort(index)}
                  right={() => <List.Icon icon={sortBy === (index % 2 === 0 ? 'price' : 'year') && sortOrder === (index < 2 ? 'asc' : 'desc') ? 'check' : 'blank'} />}
                />
              ))}
            </List.Section>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMenuVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e88e5',
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchbar: {
    margin: 8,
    elevation: 4,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  chip: {
    margin: 4,
  },
  listContent: {
    padding: 8,
  },
  carItem: {
    marginBottom: 12,
    elevation: 3,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 4,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#757575',
  },
});
