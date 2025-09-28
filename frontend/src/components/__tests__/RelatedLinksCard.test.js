import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatedLinksCard from '../RelatedLinksCard';
import * as ReactRouterDom from 'react-router-dom';
import { renderWithProviders } from './utils/test-utils';

const mockNavigate = jest.fn();
jest.spyOn(ReactRouterDom, 'useNavigate').mockReturnValue(mockNavigate);

// Импортируем моки при необходимости
// import { ColorModeContext } from './utils/test-utils';

describe('RelatedLinksCard', () => {
  test('рендерится без ошибок', () => {
    const links = [
      { title: 'ГОСТ 7.32-2017', description: 'Требования к отчетам', href: '/docs/gost-7-32' },
      { title: 'Методичка кафедры', description: 'Шаблон курсовой', href: '/docs/methodology' }
    ];

    renderWithProviders(<RelatedLinksCard title="Полезные материалы" links={links} />);

    expect(screen.getByText('Полезные материалы')).toBeInTheDocument();
    expect(screen.getByText('ГОСТ 7.32-2017')).toBeInTheDocument();
  });
  
  // Добавьте дополнительные тесты для компонента
});
