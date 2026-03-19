import { useState } from 'react';
import { Box, TextField } from '@mui/material';
import { PhoneInput } from 'shared/ui';

interface PersonalInfoStepProps {
  firstName: string;
  lastName: string;
  phone: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function PersonalInfoStep({
  firstName,
  lastName,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
}: PersonalInfoStepProps) {
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
  });

  const getError = (field: 'firstName' | 'lastName') => {
    if (!touched[field]) return '';

    switch (field) {
      case 'firstName':
        return !firstName.trim() ? 'Имя обязательно' : '';
      case 'lastName':
        return !lastName.trim() ? 'Фамилия обязательна' : '';
      default:
        return '';
    }
  };

  // Проверка телефона: минимум 11 цифр (код + номер)
  const getPhoneError = () => {
    if (!touched.phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) return 'Введите полный номер';
    return '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          label="Имя"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
          required
          autoComplete="given-name"
          error={!!getError('firstName')}
          helperText={getError('firstName')}
        />
        <TextField
          fullWidth
          label="Фамилия"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
          required
          autoComplete="family-name"
          error={!!getError('lastName')}
          helperText={getError('lastName')}
        />
      </Box>

      <Box onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}>
        <PhoneInput
          value={phone}
          onChange={onPhoneChange}
          error={!!getPhoneError()}
          helperText={getPhoneError()}
        />
      </Box>
    </Box>
  );
}
