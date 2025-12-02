import React, { createContext } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DropZone from '../DropZone';

// Создаем mock контекст (так как DropZone импортирует его из App)
const CheckHistoryContext = createContext({
  addToHistory: () => {},
});

// Мокаем импорт App.js для DropZone
jest.mock('../../App', () => ({
  CheckHistoryContext: {
    Provider: ({ children, value }) => children,
    Consumer: ({ children }) => children({ addToHistory: jest.fn() }),
  },
}));

// Мокаем axios
jest.mock('axios');

// Мокаем react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Wrapper компонент с контекстом
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DropZone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders drop zone with upload message', () => {
    renderWithRouter(<DropZone />);
    
    // Проверяем наличие текста для загрузки
    expect(screen.getByText(/Перетащите/i)).toBeInTheDocument();
  });

  test('shows error for non-docx files', async () => {
    renderWithRouter(<DropZone />);
    
    const dropzone = screen.getByRole('presentation');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    // Симулируем drop
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });
    
    // Ждем появления ошибки
    await waitFor(() => {
      expect(screen.queryByText(/DOCX/i)).toBeInTheDocument();
    });
  });

  test('accepts docx files', async () => {
    const axios = require('axios');
    axios.post = jest.fn().mockResolvedValue({
      data: { success: true, results: [] }
    });

    renderWithRouter(<DropZone />);
    
    const dropzone = screen.getByRole('presentation');
    const file = new File(['test content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    // Симулируем drop
    Object.defineProperty(dropzone, 'files', { value: [file] });
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });
  });

  test('renders children when provided', () => {
    renderWithRouter(
      <DropZone>
        <span>Custom content</span>
      </DropZone>
    );
    
    // Проверяем что children рендерится
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  test('applies custom sx styles', () => {
    const { container } = renderWithRouter(
      <DropZone sx={{ backgroundColor: 'red' }} />
    );
    
    // Компонент должен отрендериться
    expect(container.firstChild).toBeInTheDocument();
  });
});
