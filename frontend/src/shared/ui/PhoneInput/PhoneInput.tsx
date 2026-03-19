import { useState, forwardRef } from 'react';
import { TextField, InputAdornment, Select, MenuItem, Box, Typography } from '@mui/material';
import { IMaskInput } from 'react-imask';

// СНГ страны с кодами и масками
const CIS_COUNTRIES = [
  { code: 'RU', name: 'Россия', dialCode: '+7', mask: '(000) 000-00-00', placeholder: '(999) 123-45-67', flag: '🇷🇺' },
  { code: 'KZ', name: 'Казахстан', dialCode: '+7', mask: '(000) 000-00-00', placeholder: '(701) 234-56-78', flag: '🇰🇿' },
  { code: 'BY', name: 'Беларусь', dialCode: '+375', mask: '(00) 000-00-00', placeholder: '(29) 123-45-67', flag: '🇧🇾' },
  { code: 'UA', name: 'Украина', dialCode: '+380', mask: '(00) 000-00-00', placeholder: '(67) 123-45-67', flag: '🇺🇦' },
  { code: 'UZ', name: 'Узбекистан', dialCode: '+998', mask: '(00) 000-00-00', placeholder: '(90) 123-45-67', flag: '🇺🇿' },
  { code: 'KG', name: 'Кыргызстан', dialCode: '+996', mask: '(000) 00-00-00', placeholder: '(555) 12-34-56', flag: '🇰🇬' },
  { code: 'TJ', name: 'Таджикистан', dialCode: '+992', mask: '(00) 000-00-00', placeholder: '(90) 123-45-67', flag: '🇹🇯' },
  { code: 'AM', name: 'Армения', dialCode: '+374', mask: '(00) 00-00-00', placeholder: '(91) 12-34-56', flag: '🇦🇲' },
  { code: 'AZ', name: 'Азербайджан', dialCode: '+994', mask: '(00) 000-00-00', placeholder: '(50) 123-45-67', flag: '🇦🇿' },
  { code: 'MD', name: 'Молдова', dialCode: '+373', mask: '(00) 00-00-00', placeholder: '(69) 12-34-56', flag: '🇲🇩' },
] as const;

interface MaskedInputProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  mask: string;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  function MaskedInput(props, ref) {
    const { onChange, mask, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask={mask}
        definitions={{ '0': /[0-9]/ }}
        inputRef={ref}
        onAccept={(value: string) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  }
);

export interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  error?: boolean;
  helperText?: string;
}

export function PhoneInput({ value: _value, onChange, error, helperText }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('RU');
  const [localNumber, setLocalNumber] = useState('');

  const country = CIS_COUNTRIES.find((c) => c.code === countryCode) || CIS_COUNTRIES[0];

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const newCountry = CIS_COUNTRIES.find((c) => c.code === newCode);
    if (newCountry) {
      const cleanNumber = localNumber.replace(/\D/g, '');
      onChange(cleanNumber ? `${newCountry.dialCode}${cleanNumber}` : '');
    }
  };

  const handleNumberChange = (maskedValue: string) => {
    setLocalNumber(maskedValue);
    const cleanNumber = maskedValue.replace(/\D/g, '');
    onChange(cleanNumber ? `${country.dialCode}${cleanNumber}` : '');
  };

  return (
    <TextField
      fullWidth
      label="Телефон"
      value={localNumber}
      onChange={(e) => handleNumberChange(e.target.value)}
      placeholder={country.placeholder}
      error={error}
      helperText={helperText}
      autoComplete="tel"
      InputProps={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputComponent: MaskedInput as any,
        inputProps: { mask: country.mask },
        startAdornment: (
          <InputAdornment position="start" sx={{ mr: 0 }}>
            <Select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{
                '& .MuiSelect-select': {
                  py: 0,
                  pr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                },
              }}
              renderValue={(selected) => {
                const c = CIS_COUNTRIES.find((c) => c.code === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography component="span">{c?.flag}</Typography>
                    <Typography component="span" variant="body2">{c?.dialCode}</Typography>
                  </Box>
                );
              }}
            >
              {CIS_COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dialCode})
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        ),
      }}
    />
  );
}
