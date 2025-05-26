import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplatesSection from '../TemplatesSection';

describe('TemplatesSection', () => {
  const mockTemplates = [
    {
      name: 'Отчет по практике',
      description: 'Шаблон для оформления отчета по учебной и производственной практике',
      tags: ['Практика', 'Отчет'],
      size: '125 КБ',
      format: 'DOCX',
      downloadUrl: '/templates/practice-report.docx',
      filename: 'otchet-po-praktike.docx'
    },
    {
      name: 'Курсовая работа',
      description: 'Шаблон для оформления курсовой работы по ГОСТ',
      tags: ['Курсовая', 'ГОСТ'],
      size: '156 КБ',
      format: 'DOCX',
      downloadUrl: '/templates/coursework.docx',
      filename: 'kursovaya-rabota.docx'
    }
  ];

  test('рендерит заголовок секции', () => {
    render(<TemplatesSection templates={mockTemplates} />);
    expect(screen.getByText('Шаблоны документов')).toBeInTheDocument();
  });

  test('рендерит кастомный заголовок секции', () => {
    render(<TemplatesSection templates={mockTemplates} title="Образцы работ" />);
    expect(screen.getByText('Образцы работ')).toBeInTheDocument();
  });

  test('рендерит корректное количество карточек шаблонов', () => {
    render(<TemplatesSection templates={mockTemplates} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(mockTemplates.length);
  });

  test('отображает правильную информацию для каждого шаблона', () => {
    render(<TemplatesSection templates={mockTemplates} />);
    
    mockTemplates.forEach(template => {
      expect(screen.getByText(template.name)).toBeInTheDocument();
      expect(screen.getByText(template.description)).toBeInTheDocument();
      
      template.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
      
      expect(screen.getByText(`Размер: ${template.size} • Формат: ${template.format}`)).toBeInTheDocument();
    });
  });

  test('кнопки скачивания имеют правильные атрибуты', () => {
    render(<TemplatesSection templates={mockTemplates} />);
    
    const downloadButtons = screen.getAllByText('Скачать шаблон');
    
    downloadButtons.forEach((button, index) => {
      const buttonElement = button.closest('a');
      expect(buttonElement).toHaveAttribute('href', mockTemplates[index].downloadUrl);
      expect(buttonElement).toHaveAttribute('download', mockTemplates[index].filename);
    });
  });

  test('рендерит пустую сетку без шаблонов', () => {
    render(<TemplatesSection templates={[]} />);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
  });
}); 