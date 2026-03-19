import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useGetProfileQuery, useUpdateProfileMutation } from 'entities/user';
import { Loader } from 'shared/ui';

export function ProfilePage() {
  const { data: user, isLoading, error } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');

  const handleEdit = () => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setBio(user.profile?.bio || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ firstName, lastName, bio }).unwrap();
      setIsEditing(false);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ position: 'relative', minHeight: 300 }}>
        <Loader isVisible />
      </Box>
    );
  }

  if (error || !user) {
    return <Alert severity="error">Ошибка загрузки профиля</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Приветственный алерт */}
      <Alert severity="success" sx={{ mb: 2 }}>
        Добро пожаловать, {user.firstName}! 👋
      </Alert>

      <Paper sx={{ p: 3 }}>
        {/* Header с аватаром */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Avatar
            src={user.profile?.avatarUrl}
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '1.25rem',
            }}
          >
            {user.firstName[0]}{user.lastName[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" component="h1">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              onClick={handleEdit}
              sx={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                width: { xs: '100%', sm: 'auto' },
                mt: { xs: 1, sm: 0 },
              }}
            >
              Редактировать
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Личные данные
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Box>
            <TextField
              fullWidth
              label="О себе"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              multiline
              rows={3}
              placeholder="Расскажите немного о себе..."
            />
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleCancel}>
                Отмена
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Сохранить'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Контакты
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Телефон</Typography>
                  <Typography variant="body2">{user.phone || '—'}</Typography>
                </Box>
              </Box>
            </Box>

            {user.profile?.bio && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  О себе
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {user.profile.bio}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
