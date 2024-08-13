import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Image } from 'react-native';
import { Title, Text, Chip, Searchbar, ActivityIndicator, Modal, Portal, Button, Divider, Menu, List, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firestore } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const navigation = useNavigation();

  const fetchCars = useCallback(() => {
    setLoading(true);
    const unsubscribe = firestore.collection('cars').onSnapshot(snapshot => {
      const carList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCars(carList);
      setLoading(false);
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = fetchCars();
    return () => unsubscribe();
  }, [fetchCars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCars();
  }, [fetchCars]);

  const onChangeSearch = (query) => setSearchQuery(query);

  const filteredAndSortedCars = cars
    .filter(car =>
      (car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedFilters.length === 0 || selectedFilters.includes(car.type))
    )
    .sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (sortBy === 'year') {
        return sortOrder === 'asc' ? a.year - b.year : b.year - a.year;
      }
      return 0;
    });

  const renderCarItem = ({ item }) => (
    viewMode === 'list' ? (
      <List.Item
        title={`${item.make} ${item.model}`}
        description={`${item.year} - $${item.price}/day`}
        left={() => <Image source={{ uri: item.imageUrl }} style={styles.carImage} />}
        right={() => (
          <View style={styles.rightContent}>
            <Chip icon="car" style={styles.chip}>{item.type}</Chip>
            <Icon name="chevron-right" size={24} color="#888" />
          </View>
        )}
        onPress={() => navigation.navigate('CarDetails', { car: item })}
        style={styles.listItem}
      />
    ) : (
      <Card style={styles.gridItem} onPress={() => navigation.navigate('CarDetails', { car: item })}>
        <Card.Cover source={{ uri: item.imageUrl }} style={styles.carImageGrid} />
        <Card.Content>
          <Title>{item.make} {item.model}</Title>
          <Text>${item.price}/day - {item.year}</Text>
          <Chip icon="car" style={styles.chip}>{item.type}</Chip>
        </Card.Content>
      </Card>
    )
  );

  const toggleFilter = (filter) => {
    setSelectedFilters(prevFilters =>
      prevFilters.includes(filter)
        ? prevFilters.filter(f => f !== filter)
        : [...prevFilters, filter]
    );
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setMenuVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Dashboard</Title>
        <View style={styles.headerIcons}>
          <IconButton
            icon={viewMode === 'list' ? 'view-grid' : 'view-list'}
            size={24}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          />
          <IconButton
            icon="heart"
            size={24}
            onPress={() => navigation.navigate('Favorites')}
          />
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by make or model"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => setFilterModalVisible(true)}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="sort" size={24} onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item onPress={() => handleSort('price')} title="Sort by Price" />
          <Menu.Item onPress={() => handleSort('year')} title="Sort by Year" />
        </Menu>
      </View>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loading} />
      ) : (
        <FlatList
          key={viewMode}  // Force re-render by changing key based on viewMode
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
          ItemSeparatorComponent={() => viewMode === 'list' && <Divider />}
          numColumns={viewMode === 'grid' ? 2 : 1}
        />
      )}
      <Portal>
        <Modal visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Title>Filter by Car Type</Title>
          <View style={styles.filterChips}>
            {['Sedan', 'SUV', 'Hatchback', 'Truck'].map(filter => (
              <Chip
                key={filter}
                selected={selectedFilters.includes(filter)}
                onPress={() => toggleFilter(filter)}
                style={styles.filterChip}
              >
                {filter}
              </Chip>
            ))}
          </View>
          <Button mode="contained" onPress={() => setFilterModalVisible(false)}>Apply Filters</Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  searchbar: {
    flex: 1,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    backgroundColor: '#fff',
  },
  carImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  carImageGrid: {
    height: 120,
  },
  gridItem: {
    flex: 1,
    margin: 5,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    marginRight: 10,
  },
  loading: {
    marginTop: 50,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 5,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 20,
  },
  filterChip: {
    margin: 5,
  },
  emptyList: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#888',
  },
});
