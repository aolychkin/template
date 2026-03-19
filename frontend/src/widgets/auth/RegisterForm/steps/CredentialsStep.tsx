import { useState } from 'react';
import { Box, TextField, LinearProgress, Typography } from '@mui/material';
import { validateEmail, validatePassword } from 'shared/lib/validation';

interface CredentialsStepProps {
  email: string;
  password: string;
  passwordConfirm: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
}

function getPasswordStrength(password: string): { score: number; label: string; color: 'error' | 'warning' | 'success' } {
  if (!password) return { score: 0, label: '', color: 'error' };

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  if (score < 40) return { score, label: 'Слабый', color: 'error' };
  if (score < 70) return { score, label: 'Средний', color: 'warning' };
  return { score, label: 'Надёжный', color: 'success' };
}

export function CredentialsStep({
  email,
  password,
  passwordConfirm,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
}: CredentialsStepProps) {
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    passwordConfirm: false,
  });

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === passwordConfirm;
  const strength = getPasswordStrength(password);

  const getEmailError = () => {
    if (!touched.email) return '';
    return emailValidation.error || '';
  };

  const getPasswordError = () => {
    if (!touched.password) return '';
    return passwordValidation.error || '';
  };

  const getConfirmError = () => {
    if (!touched.passwordConfirm || !passwordConfirm) return '';
    return !passwordsMatch ? 'Пароли не совпадают' : '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        required
        autoComplete="email"
        error={!!getEmailError()}
        helperText={getEmailError()}
      />

      <Box>
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          required
          autoComplete="new-password"
          error={!!getPasswordError()}
          helperText={getPasswordError()}
        />
        {password && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Сложность пароля
              </Typography>
              <Typography variant="caption" color={`${strength.color}.main`}>
                {strength.label}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={strength.score}
              color={strength.color}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </Box>

      <TextField
        fullWidth
        label="Подтверждение пароля"
        type="password"
        value={passwordConfirm}
        onChange={(e) => onPasswordConfirmChange(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, passwordConfirm: true }))}
        required
        autoComplete="new-password"
        error={!!getConfirmError()}
        helperText={getConfirmError()}
      />
    </Box>
  );
}
