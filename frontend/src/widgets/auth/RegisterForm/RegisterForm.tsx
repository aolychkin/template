import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { useRegisterMutation, setCredentials } from 'entities/session';
import { useAppDispatch } from 'shared/lib/hooks';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { CredentialsStep } from './steps/CredentialsStep';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const handleChange = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      }).unwrap();

      dispatch(
        setCredentials({
          tokens: result.tokens,
          user: result.user,
        })
      );
      navigate('/profile');
    } catch {
      // Error handled by RTK Query
    }
  };

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    formData.email &&
    formData.password &&
    formData.password === formData.passwordConfirm;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка регистрации. Проверьте данные и попробуйте снова.
        </Alert>
      )}

      <Typography variant="overline" color="text.secondary">
        Личные данные
      </Typography>
      <PersonalInfoStep
        firstName={formData.firstName}
        lastName={formData.lastName}
        phone={formData.phone}
        onFirstNameChange={handleChange('firstName')}
        onLastNameChange={handleChange('lastName')}
        onPhoneChange={handleChange('phone')}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="overline" color="text.secondary">
        Учётные данные
      </Typography>
      <CredentialsStep
        email={formData.email}
        password={formData.password}
        passwordConfirm={formData.passwordConfirm}
        onEmailChange={handleChange('email')}
        onPasswordChange={handleChange('password')}
        onPasswordConfirmChange={handleChange('passwordConfirm')}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isFormValid || isLoading}
        sx={{ mt: 3 }}
      >
        {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Зарегистрироваться'}
      </Button>
    </Box>
  );
}
