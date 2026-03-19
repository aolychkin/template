import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import PeopleIcon from '@mui/icons-material/People';

describe('EmptyState', () => {
  it('renders with title only', () => {
    const { getByText } = render(<EmptyState title="Нет данных" />);

    expect(getByText('Нет данных')).toBeInTheDocument();
  });

  it('renders with all props', () => {
    const handleClick = vi.fn();

    const { getByText, getByTestId, getByRole } = render(
      <EmptyState
        title="Нет пользователей"
        description="Пользователи появятся здесь после регистрации"
        icon={<PeopleIcon data-testid="custom-icon" />}
        action={{ label: 'Добавить', onClick: handleClick }}
      />
    );

    expect(getByText('Нет пользователей')).toBeInTheDocument();
    expect(getByText('Пользователи появятся здесь после регистрации')).toBeInTheDocument();
    expect(getByTestId('custom-icon')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Добавить' })).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', () => {
    const handleClick = vi.fn();

    const { getByRole } = render(
      <EmptyState
        title="Нет данных"
        action={{ label: 'Действие', onClick: handleClick }}
      />
    );

    getByRole('button', { name: 'Действие' }).click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders default icon when no icon provided', () => {
    const { getByTestId } = render(<EmptyState title="Нет данных" />);

    // InboxIcon is rendered by default
    expect(getByTestId('InboxIcon')).toBeInTheDocument();
  });

  it('renders default title when empty string provided', () => {
    const { getByText } = render(<EmptyState title="" />);

    expect(getByText('Нет данных')).toBeInTheDocument();
  });
});
