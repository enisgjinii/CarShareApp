import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, StatusBar, RefreshControl, ScrollView, Image } from 'react-native';
import { Appbar, Card, Title, Paragraph, Chip, ActivityIndicator, Searchbar, DataTable, Menu, Button, IconButton, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../firebase';
const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'price', order: 'asc' },
  { label: 'Price: High to Low', value: 'price', order: 'desc' },
  { label: 'Year: Newest', value: 'year', order: 'desc' },
  { label: 'Year: Oldest', value: 'year', order: 'asc' },
];
const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  TABLE: 'table',
};
export default function DashboardScreen() {
  const [cars, setCars] = useState([]);
  const theme = useTheme();
  const [filteredCars, setFilteredCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  const fetchCategories = useCallback(async () => {
    try {
      const snapshot = await firestore.collection('categories').get();
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      let query = firestore.collection('cars');
      if (selectedCategory) {
        query = query.where('categoryId', '==', selectedCategory);
      }
      const snapshot = await query.get();
      let fetchedCars = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(car => car && car.make && car.model && car.price); // Filter out invalid cars
      fetchedCars.sort((a, b) => {
        if (sortOption.order === 'asc') {
          return (a[sortOption.value] || 0) - (b[sortOption.value] || 0);
        } else {
          return (b[sortOption.value] || 0) - (a[sortOption.value] || 0);
        }
      });
      setCars(fetchedCars);
      setFilteredCars(fetchedCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, sortOption]);
  useEffect(() => {
    fetchCategories();
    fetchCars();
  }, [fetchCategories, fetchCars]);
  useEffect(() => {
    const filtered = cars.filter(car =>
      car && (
        (car.make && car.make.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (car.model && car.model.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
    setFilteredCars(filtered);
  }, [searchQuery, cars]);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCars();
  }, [fetchCars]);
  const renderGridItem = ({ item }) => {
    if (!item) return null;
    return (
      <Card style={[styles.gridCard, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('CarDetails', { car: item })}>
        <Card.Cover source={{ uri: item.imageUrl }} style={styles.gridImage} />
        <Card.Content>
          <Title style={[styles.gridTitle, { color: theme.colors.text }]}>{`${item.make || 'N/A'} ${item.model || 'N/A'}`}</Title>
          <Paragraph style={{ color: theme.colors.text }}>{`$${item.price || 'N/A'}/day`}</Paragraph>
        </Card.Content>
      </Card>
    );
  };
  const renderListItem = ({ item }) => {
    if (!item) return null;
    return (
      <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('CarDetails', { car: item })}>
        <Card.Title
          title={`${item.make || 'N/A'} ${item.model || 'N/A'}`}
          subtitle={`$${item.price || 'N/A'}/day - ${item.year || 'N/A'}`}
          titleStyle={{ color: theme.colors.text }}
          subtitleStyle={{ color: theme.colors.text }}
          left={(props) => <Image {...props} source={{ uri: item.imageUrl }} style={styles.listImage} />}
        />
      </Card>
    );
  };
  const renderTableItem = (item) => {
    if (!item) return null;
    return (
      <DataTable.Row key={item.id} onPress={() => navigation.navigate('CarDetails', { car: item })}>
        <DataTable.Cell textStyle={{ color: theme.colors.text }}>{`${item.make || 'N/A'} ${item.model || 'N/A'}`}</DataTable.Cell>
        <DataTable.Cell numeric textStyle={{ color: theme.colors.text }}>{item.year || 'N/A'}</DataTable.Cell>
        <DataTable.Cell numeric textStyle={{ color: theme.colors.text }}>{`$${item.price || 'N/A'}`}</DataTable.Cell>
      </DataTable.Row>
    );
  };
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
    }
    const EmptyListComponent = () => (
      <Paragraph style={styles.emptyList}>No cars found.</Paragraph>
    );
    switch (viewMode) {
      case VIEW_MODES.GRID:
        return (
          <FlatList
            key="grid"
            data={filteredCars}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={EmptyListComponent}
          />
        );
      case VIEW_MODES.LIST:
        return (
          <FlatList
            key="list"
            data={filteredCars}
            renderItem={renderListItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={EmptyListComponent}
          />
        );
      case VIEW_MODES.TABLE:
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Car</DataTable.Title>
                <DataTable.Title numeric>Year</DataTable.Title>
                <DataTable.Title numeric>Price/Day</DataTable.Title>
              </DataTable.Header>
              {filteredCars.map(renderTableItem)}
            </DataTable>
            {filteredCars.length === 0 && <EmptyListComponent />}
          </ScrollView>
        );
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Car Rental" titleStyle={{ color: theme.colors.accent }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="sort" color={theme.colors.accent} onPress={() => setMenuVisible(true)} />
          }
        >
          {SORT_OPTIONS.map((option, index) => (
            <Menu.Item
              key={index}
              onPress={() => {
                setSortOption(option);
                setMenuVisible(false);
                fetchCars();
              }}
              title={option.label}
              titleStyle={{ color: theme.colors.text }}
            />
          ))}
        </Menu>
        <IconButton icon="view-grid" color={theme.colors.accent} onPress={() => setViewMode(VIEW_MODES.GRID)} />
        <IconButton icon="view-list" color={theme.colors.accent} onPress={() => setViewMode(VIEW_MODES.LIST)} />
        <IconButton icon="table" color={theme.colors.accent} onPress={() => setViewMode(VIEW_MODES.TABLE)} />
      </Appbar.Header>
      <Searchbar
        placeholder="Search cars"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.placeholder}
        iconColor={theme.colors.text}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map(category => (
          <Chip
            key={category.id}
            style={[styles.categoryChip, { backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface }]}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            textStyle={{ color: selectedCategory === category.id ? theme.colors.accent : theme.colors.text }}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>
      {renderContent()}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 10,
  },
  categoryContainer: {
    padding: 10,
  },
  categoryChip: {
    marginRight: 8,
  },
  gridList: {
    padding: 8,
  },
  gridCard: {
    flex: 1,
    margin: 8,
  },
  gridImage: {
    height: 120,
  },
  gridTitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 8,
  },
  listCard: {
    marginBottom: 8,
  },
  listImage: {
    width: 50,
    height: 50,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 50,
  },
});