import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Appbar, 
  Button, 
  Card, 
  Text, 
  Avatar, 
  Chip, 
  Divider, 
  List,
  Surface,
  useTheme
} from 'react-native-paper';
import { router } from 'expo-router';

const mockUser = {
  name: 'Laura Fernández',
  email: 'laura.fernandez@example.com',
  profileImage: '',
  userType: 'docente', // 'alumno' también posible
  bio: 'Apasionada por la educación digital. Me encanta enseñar y aprender cosas nuevas todos los días.',
  phone: '+54 9 11 1234 5678',
  specialization: 'Tecnologías de la Información',
  experience: '5 años enseñando programación y bases de datos.',
  grade: '',
  interests: [],
  createdAt: new Date().toISOString(),
};

export default function MyProfileScreen() {
  const theme = useTheme();
  const user = mockUser;

  const handleEditProfile = () => {
    alert('Funcionalidad de edición de perfil aún no implementada');
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Mi Perfil" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.profileHeader} elevation={2}>
          {user.profileImage ? (
            <Avatar.Image size={80} source={{ uri: user.profileImage }} />
          ) : (
            <Avatar.Text 
              size={80} 
              label={user.name.split(' ').map(n => n[0]).join('')} 
            />
          )}
          <View style={styles.profileHeaderInfo}>
            <Text variant="headlineSmall" style={styles.name}>{user.name}</Text>
            <Chip 
              icon={user.userType === 'docente' ? 'school' : 'account-school'} 
              style={{ backgroundColor: user.userType === 'docente' ? theme.colors.primary : theme.colors.secondary }}
            >
              {user.userType === 'docente' ? 'Docente' : 'Alumno'}
            </Chip>
          </View>
        </Surface>

        <Card style={styles.card}>
          {user.bio && (
            <>
              <Card.Title title="Biografía" />
              <Card.Content>
                <Text variant="bodyMedium">{user.bio}</Text>
              </Card.Content>
              <Divider />
            </>
          )}

          <Card.Title title="Información de contacto" />
          <Card.Content>
            <List.Item
              title="Email"
              description={user.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            {user.phone && (
              <List.Item
                title="Teléfono"
                description={user.phone}
                left={props => <List.Icon {...props} icon="phone" />}
              />
            )}
          </Card.Content>

          {user.userType === 'docente' && (
            <>
              <Divider />
              <Card.Title title="Información profesional" />
              <Card.Content>
                {user.specialization && (
                  <List.Item
                    title="Especialización"
                    description={user.specialization}
                    left={props => <List.Icon {...props} icon="book-open-variant" />}
                  />
                )}
                {user.experience && (
                  <List.Item
                    title="Experiencia"
                    description={user.experience}
                    left={props => <List.Icon {...props} icon="briefcase" />}
                  />
                )}
              </Card.Content>
            </>
          )}

          {user.userType === 'alumno' && (
            <>
              <Divider />
              <Card.Title title="Información académica" />
              <Card.Content>
                {user.grade && (
                  <List.Item
                    title="Nivel"
                    description={user.grade}
                    left={props => <List.Icon {...props} icon="school" />}
                  />
                )}
                {user.interests && user.interests.length > 0 && (
                  <View>
                    <Text variant="titleSmall" style={styles.interestsLabel}>Intereses:</Text>
                    <View style={styles.interestsContainer}>
                      {user.interests.map((interest, index) => (
                        <Chip key={index} style={styles.interestChip}>{interest}</Chip>
                      ))}
                    </View>
                  </View>
                )}
              </Card.Content>
            </>
          )}

          <Divider />
          <Card.Content style={styles.joinDateContainer}>
            <Text variant="bodySmall" style={styles.joinDate}>
              Miembro desde: {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>
        
        <Button 
          mode="contained" 
          icon="account-edit" 
          onPress={handleEditProfile}
          style={styles.editButton}
        >
          Editar Perfil
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  profileHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
  },
  interestsLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    margin: 4,
  },
  joinDateContainer: {
    paddingTop: 8,
  },
  joinDate: {
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'right',
  },
  editButton: {
    marginTop: 8,
  },
});
