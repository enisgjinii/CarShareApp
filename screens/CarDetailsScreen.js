import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card } from 'react-native-paper';

export default function CarDetailsScreen({ route, navigation }) {
    const { car } = route.params;

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: car.imageUrl }} style={styles.image} />
            <Card style={styles.card}>
                <Card.Content>
                    <Title>{car.make} {car.model}</Title>
                    <Paragraph>Year: {car.year}</Paragraph>
                    <Paragraph>Price: ${car.price}/day</Paragraph>
                    <Paragraph>Type: {car.type}</Paragraph>
                    <Paragraph>Description: {car.description}</Paragraph>
                </Card.Content>
                <Card.Actions>
                    <Button onPress={() => {/* Implement booking logic */ }}>Book Now</Button>
                    <Button onPress={() => navigation.goBack()}>Go Back</Button>
                </Card.Actions>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 200,
    },
    card: {
        margin: 16,
    },
});
